import { OutputType } from "boltz-core";
import log from "loglevel";
import { createEffect, onCleanup, onMount } from "solid-js";

import { config } from "../config";
import { BTC, LBTC, RBTC } from "../consts/Assets";
import { SwapType } from "../consts/Enums";
import {
    swapStatusFinal,
    swapStatusPending,
    swapStatusSuccess,
} from "../consts/SwapStatus";
import { useGlobalContext } from "../context/Global";
import { SwapStatusTransaction, usePayContext } from "../context/Pay";
import {
    getChainSwapTransactions,
    getReverseTransaction,
    postChainSwapDetails,
} from "../utils/boltzClient";
import {
    claim,
    createSubmarineSignature,
    createTheirPartialChainSwapSignature,
} from "../utils/claim";
import { formatError } from "../utils/errors";
import { getApiUrl, getWsFallback } from "../utils/helper";
import Lock from "../utils/lock";
import {
    ChainSwap,
    ReverseSwap,
    SubmarineSwap,
    getRelevantAssetForSwap,
} from "../utils/swapCreator";

type SwapStatus = {
    id: string;
    status: string;

    failureReason?: string;
    transaction?: SwapStatusTransaction;
};

const coopClaimableSymbols = [BTC, LBTC];

const reconnectInterval = 5_000;

class BoltzWebSocket {
    private readonly swapClaimLock = new Lock();

    private ws?: WebSocket;
    private reconnectTimeout?: ReturnType<typeof setTimeout>;
    private isClosed: boolean = false;

    constructor(
        readonly url: string,
        private readonly wsFallback: string | undefined,
        private readonly relevantIds: Set<string>,
        private readonly prepareSwap: (id: string, status: SwapStatus) => void,
        private readonly claimSwap: (
            id: string,
            status: SwapStatus,
        ) => Promise<void>,
    ) {}

    public connect = () => {
        log.debug("Opening WebSocket");
        this.openWebSocket(`${this.url}/v2/ws`).catch(() => {
            if (this.wsFallback !== undefined) {
                log.debug("Opening fallback WebSocket");
                void this.openWebSocket(this.wsFallback).then().catch();
            }
        });
    };

    public close = () => {
        this.isClosed = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        this.ws?.close();
    };

    // "force" skips the check if we already subscribed to all the ids
    public subscribeUpdates = (ids: string[], force = false) => {
        if (!force && ids.every((id) => this.relevantIds.has(id))) {
            return;
        }

        ids.forEach((id) => this.relevantIds.add(id));
        if (this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        this.ws.send(
            JSON.stringify({
                op: "subscribe",
                channel: "swap.update",
                args: ids,
            }),
        );
    };

    private openWebSocket = (url: string) => {
        this.isClosed = false;
        clearTimeout(this.reconnectTimeout);
        this.ws?.close();

        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onerror = (error) => {
                log.error("WebSocket error", error);
            };
            this.ws.onopen = () => {
                this.subscribeUpdates(
                    Array.from(this.relevantIds.values()),
                    true,
                );
            };
            this.ws.onclose = (error) => {
                log.warn("WebSocket closed", error);
                this.handleClose();

                if (error.wasClean) {
                    resolve();
                } else {
                    reject(new Error(formatError(error)));
                }
            };
            this.ws.onmessage = async (msg) => {
                const data = JSON.parse(msg.data);
                if (data.event === "pong" || data.event === "ping") {
                    return;
                }

                log.debug(`WebSocket message:`, data);

                if (data.event === "update" && data.channel === "swap.update") {
                    const swapUpdates = data.args as SwapStatus[];
                    for (const status of swapUpdates) {
                        this.relevantIds.add(status.id);
                        this.prepareSwap(status.id, status);
                        await this.swapClaimLock.acquire(() =>
                            this.claimSwap(status.id, status),
                        );
                    }
                }
            };
        });
    };

    private handleClose = () => {
        // Don't reconnect when it has been closed manually
        if (this.isClosed) {
            return;
        }

        this.reconnectTimeout = setTimeout(
            () => this.connect(),
            reconnectInterval,
        );
    };
}

export const SwapChecker = () => {
    const {
        swap,
        setSwap,
        setSwapStatus,
        setSwapStatusTransaction,
        setFailureReason,
    } = usePayContext();
    const {
        notify,
        updateSwapStatus,
        getSwap,
        getSwaps,
        setSwapStorage,
        t,
        backend,
        setBackend,
    } = useGlobalContext();

    let ws: BoltzWebSocket | undefined = undefined;

    const prepareSwap = async (swapId: string, data: SwapStatus) => {
        const currentSwap = await getSwap(swapId);
        if (currentSwap === null) {
            log.warn(`prepareSwap: swap ${swapId} not found`);
            return;
        }
        if (swap() && swap().id === currentSwap.id) {
            setSwapStatus(data.status);
            if (data.transaction) {
                setSwapStatusTransaction(data.transaction);
            }
            if (data.failureReason) {
                setFailureReason(data.failureReason);
            }
        }
        if (data.status) {
            await updateSwapStatus(currentSwap.id, data.status);
        }
    };

    const claimSwap = async (swapId: string, data: SwapStatus) => {
        const currentSwap = await getSwap(swapId);
        if (currentSwap === null) {
            log.warn(`claimSwap: swap ${swapId} not found`);
            return;
        }

        if (
            currentSwap.type === SwapType.Chain &&
            data.status === swapStatusPending.TransactionClaimPending &&
            coopClaimableSymbols.includes((currentSwap as ChainSwap).assetSend)
        ) {
            await helpServerClaim(currentSwap as ChainSwap);
            return;
        }

        if (getRelevantAssetForSwap(currentSwap) === RBTC) {
            if (
                data.status === swapStatusPending.TransactionMempool &&
                data.transaction !== undefined
            ) {
                currentSwap.lockupTx = data.transaction.id;

                setSwap(currentSwap);
                await setSwapStorage(currentSwap);
            }

            return;
        }

        if (currentSwap.version !== OutputType.Taproot) {
            return;
        }

        if (data.status === swapStatusSuccess.InvoiceSettled) {
            data.transaction = await getReverseTransaction(
                currentSwap.backend || 0,
                currentSwap.id,
            );
        } else if (
            currentSwap.type === SwapType.Chain &&
            data.status === swapStatusSuccess.TransactionClaimed
        ) {
            data.transaction = (
                await getChainSwapTransactions(backend(), currentSwap.id)
            ).serverLock.transaction;
        }

        if (
            currentSwap.claimTx === undefined &&
            data.transaction !== undefined &&
            ((currentSwap.type === SwapType.Reverse &&
                [
                    swapStatusPending.TransactionConfirmed,
                    swapStatusPending.TransactionMempool,
                    swapStatusSuccess.InvoiceSettled,
                ].includes(data.status)) ||
                (currentSwap.type === SwapType.Chain &&
                    [
                        swapStatusSuccess.TransactionClaimed,
                        swapStatusPending.TransactionServerConfirmed,
                        swapStatusPending.TransactionServerMempool,
                    ].includes(data.status)))
        ) {
            try {
                const res = await claim(
                    currentSwap as ReverseSwap | ChainSwap,
                    data.transaction as { hex: string },
                );
                const claimedSwap = await getSwap(res.id);
                claimedSwap.claimTx = res.claimTx;
                await setSwapStorage(claimedSwap);

                if (claimedSwap.id === swap().id) {
                    setSwap(claimedSwap);
                }
                notify(
                    "success",
                    t("swap_completed", { id: res.id }),
                    true,
                    true,
                );
            } catch (e) {
                const msg = t("claim_fail", { id: currentSwap.id });
                log.warn(msg, e);
                notify("error", msg);
            }
        } else if (
            currentSwap.type === SwapType.Submarine &&
            data.status === swapStatusPending.TransactionClaimPending
        ) {
            try {
                await createSubmarineSignature(currentSwap as SubmarineSwap);
                notify(
                    "success",
                    t("swap_completed", { id: currentSwap.id }),
                    true,
                    true,
                );
            } catch (e) {
                if (e === "swap not eligible for a cooperative claim") {
                    log.debug(
                        `Server did not want help claiming ${currentSwap.id}`,
                    );
                    return;
                }

                const msg =
                    "creating cooperative signature for submarine swap claim failed";
                log.warn(msg, e);
                notify("error", msg);
            }
        }
    };

    const helpServerClaim = async (swap: ChainSwap) => {
        if (swap.claimTx === undefined) {
            log.warn(
                `Not helping server claim Chain Swap ${swap.id} because we have not claimed yet`,
            );
            return;
        }

        try {
            log.debug(
                `Helping server claim ${swap.assetSend} of Chain Swap ${swap.id}`,
            );
            const sig = await createTheirPartialChainSwapSignature(swap);
            await postChainSwapDetails(
                swap.backend || 0,
                swap.id,
                undefined,
                sig,
            );
        } catch (e) {
            log.warn(
                `Helping server claim Chain Swap ${swap.id} failed: ${formatError(e)}`,
            );
        }
    };

    onMount(async () => {
        const swapsToCheck = (await getSwaps()).filter(
            (s) =>
                !swapStatusFinal.includes(s.status) ||
                ((s.status === swapStatusSuccess.InvoiceSettled ||
                    (s.type === SwapType.Chain &&
                        s.status === swapStatusSuccess.TransactionClaimed)) &&
                    s.claimTx === undefined),
        );

        let i = backend();
        if (swapsToCheck.length > 0 && swapsToCheck[0].backend) {
            // the first swap in the list is the most recent, connect to its backend
            i = swapsToCheck[0].backend;
            // check if the backend is valid
            while (i >= config.backends.length) {
                i--;
            }
        }
        if (i !== backend()) {
            setBackend(i);
        }

        ws = new BoltzWebSocket(
            getApiUrl(i),
            getWsFallback(i),
            new Set<string>(swapsToCheck.map((s) => s.id)),
            prepareSwap,
            claimSwap,
        );
        ws.connect();
    });

    onCleanup(() => {
        if (ws !== undefined) {
            ws.close();
        }
    });

    createEffect(() => {
        const activeSwap = swap();
        if (activeSwap === undefined || activeSwap === null) {
            return;
        }

        let i = backend();
        if (activeSwap.backend !== undefined) {
            i = activeSwap.backend;
        }

        const correctUrl = getApiUrl(i);

        // check if API backend is correct and connected
        if (ws === undefined || ws.url !== correctUrl) {
            if (ws !== undefined) {
                ws.close();
            }

            ws = new BoltzWebSocket(
                correctUrl,
                getWsFallback(i),
                new Set<string>([]),
                prepareSwap,
                claimSwap,
            );
            ws.connect();

            if (i !== backend()) {
                setBackend(i);
            }
        }

        ws.subscribeUpdates([activeSwap.id]);
    });

    return "";
};
