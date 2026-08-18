import { hex, utf8 } from "@scure/base";
import { Buffer } from "buffer";

import { chooseUrl, config } from "../config";
import { type AssetType, BTC, LN, RBTC } from "../consts/Assets";
import { SwapType } from "../consts/Enums";
import type { deriveKeyFn } from "../context/Global";
import apiAuth from "../lazy/apiAuth";
import type {
    ChainPairTypeTaproot,
    Pairs,
    ReversePairTypeTaproot,
    SubmarinePairTypeTaproot,
} from "./boltzClient";
import type { ECKeys } from "./ecpair";
import { ECPair } from "./ecpair";
import { formatError } from "./errors";
import type {
    ChainSwap,
    ReverseSwap,
    SomeSwap,
    SubmarineSwap,
} from "./swapCreator";

export const defaultTimeoutDuration = 15_000;

export const isIos = () =>
    !!navigator.userAgent.match(/iphone|ipad/gi) || false;

export const isMobile = () =>
    isIos() || !!navigator.userAgent.match(/android|blackberry/gi) || false;

export const getReferral = (): string => {
    if (config.isPro) {
        return "pro";
    }
    return isMobile() ? "swapmarket_webapp_mobile" : "swapmarket_webapp_desktop";
};

export const parseBlindingKey = (swap: SomeSwap, isRefund: boolean) => {
    let blindingKey: string | undefined;

    switch (swap.type) {
        case SwapType.Chain:
            if (isRefund) {
                blindingKey = (swap as ChainSwap).lockupDetails.blindingKey;
            } else {
                blindingKey = (swap as ChainSwap).claimDetails.blindingKey;
            }
            break;
        default:
            blindingKey = (swap as SubmarineSwap | ReverseSwap).blindingKey;
    }

    return blindingKey ? Buffer.from(blindingKey, "hex") : undefined;
};

export const cropString = (str: string, maxLen = 40, subStrSize = 19) => {
    if (str.length < maxLen) {
        return str;
    }
    return (
        str.substring(0, subStrSize) +
        "..." +
        str.substring(str.length - subStrSize)
    );
};

export const formatAddress = (
    address?: string | null,
    groupSize = 5,
): string[] => {
    if (!address) return [];
    const clean = address.replace(/\s/g, "");
    const groups: string[] = [];
    for (let i = 0; i < clean.length; i += groupSize) {
        groups.push(clean.substring(i, i + groupSize));
    }
    return groups;
};

export const clipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
};

export const getApiUrl = (backend: number): string => {
    return chooseUrl(config.backends[backend].apiUrl);
};

export const apiSignatureHeader = "x-api-signature";
export const apiTimestampHeader = "x-api-timestamp";

// HMAC-SHA256 of "<ts><method><path><body>", computed by the wasm module
// from "npm run build:wasm-auth" and verified by the backend's own copy of
// the secret to restrict who can call its API. The timestamp bounds how
// long a captured request stays replayable, and binding method+path stops a
// signature captured for one endpoint being replayed against another that
// happens to accept a similarly-shaped body. Backends without
// "authSecretEnv" set never receive these headers
const signRequest = async (
    backend: number,
    method: string,
    path: string,
    payload: string,
): Promise<HeadersInit> => {
    const backendConfig = config.backends[backend];
    if (!backendConfig.authSecretEnv) {
        return {};
    }

    const { sign } = await apiAuth.get().catch(() => {
        throw new Error(
            `backend "${backendConfig.alias}" requires authentication, but the signing module isn't built (run "npm run build:wasm-auth")`,
        );
    });

    const ts = Math.floor(Date.now() / 1000).toString();

    let signature: Uint8Array;
    try {
        signature = sign(
            backendConfig.authSecretEnv,
            ts,
            method.toUpperCase(),
            path,
            utf8.decode(payload),
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        throw new Error(
            `backend "${backendConfig.alias}" requires authentication, but ${backendConfig.authSecretEnv} isn't baked into the signing module`,
        );
    }

    return {
        [apiSignatureHeader]: hex.encode(signature),
        [apiTimestampHeader]: ts,
    };
};

export const coalesceLn = (asset: string) => (asset === LN ? BTC : asset);

export const getPair = <
    T extends
        | SubmarinePairTypeTaproot
        | ReversePairTypeTaproot
        | ChainPairTypeTaproot,
>(
    pairs: Pairs,
    swapType: SwapType,
    assetSend: string,
    assetReceive: string,
): T | undefined => {
    if (pairs === undefined) return undefined;

    const pairSwapType = pairs[swapType];
    if (pairSwapType === undefined) return undefined;
    const pairAssetSend = pairSwapType[coalesceLn(assetSend)];
    if (pairAssetSend === undefined) return undefined;
    const pairAssetReceive = pairAssetSend[coalesceLn(assetReceive)];
    if (pairAssetReceive === undefined) return undefined;
    return pairAssetReceive as T;
};

export const constructRequestOptions = (
    options: RequestInit = {},
    timeout: number = defaultTimeoutDuration,
) => {
    const controller = new AbortController();
    const requestTimeout = setTimeout(
        () => controller.abort({ reason: "Request timed out" }),
        timeout,
    );

    const opts: RequestInit = {
        signal: controller.signal, // Default abort signal, can be overridden by options.signal
        ...options,
    };

    return { opts, requestTimeout };
};

export const fetcher = async <T = unknown>(
    backend: number,
    url: string,
    params?: Record<string, unknown>,
    options?: RequestInit,
    requestTimeoutDuration: number = defaultTimeoutDuration,
): Promise<T> => {
    const controller = new AbortController();
    const requestTimeout = setTimeout(
        () => controller.abort({ reason: "Request timed out" }),
        requestTimeoutDuration,
    );

    try {
        const referral = getReferral();
        const body = params ? JSON.stringify(params) : "";
        const method = options?.method ?? (params ? "POST" : "GET");
        const signature = await signRequest(backend, method, url, body);

        let opts: RequestInit = {
            headers: {
                referral,
                ...signature,
            },
            signal: controller.signal,
        };

        if (params) {
            opts = {
                method: "POST",
                headers: {
                    ...(options ? options.headers : opts.headers),
                    ...signature,
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body,
            };
        }

        // "options", when passed, otherwise fully replaces "opts" above, so
        // the signature has to be merged in here as well to still cover it
        const apiUrl = getApiUrl(backend) + url;
        const response = await fetch(
            apiUrl,
            options
                ? { ...options, headers: { ...options.headers, ...signature } }
                : opts,
        );

        if (!response.ok) {
            try {
                const contentType = response.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                    const body = await response.json();
                    return Promise.reject(formatError(body));
                }
                return Promise.reject(await response.text());

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return Promise.reject(response);
            }
        }
        return (await response.json()) as T;
    } catch (e) {
        throw new Error(formatError(e));
    } finally {
        clearTimeout(requestTimeout);
    }
};

export const parsePrivateKey = (
    deriveKey: deriveKeyFn,
    asset: AssetType,
    keyIndex?: number,
    privateKeyHex?: string,
): ECKeys => {
    if (keyIndex !== undefined) {
        return deriveKey(keyIndex, asset);
    }

    try {
        return ECPair.fromPrivateKey(hex.decode(privateKeyHex));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        // When the private key is not HEX, we try to decode it as WIF
        return ECPair.fromWIF(privateKeyHex);
    }
};

export const getDestinationAddress = (swap: SomeSwap) => {
    if (swap === null || swap === undefined) {
        return "";
    }

    if (swap.assetReceive === RBTC) {
        return swap.signer;
    }

    if (swap.type === SwapType.Submarine) {
        const submarineSwap = swap as SubmarineSwap;
        return submarineSwap.originalDestination || submarineSwap.invoice;
    }

    if (swap.type === SwapType.Reverse || swap.type === SwapType.Chain) {
        const chainSwap = swap as ReverseSwap | ChainSwap;
        return chainSwap.originalDestination || chainSwap.claimAddress;
    }

    return swap.claimAddress;
};
