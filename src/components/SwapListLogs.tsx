import { useNavigate } from "@solidjs/router";
import { Accessor, For, Show, createMemo } from "solid-js";

import { AssetType } from "../consts/Assets";
import { useGlobalContext } from "../context/Global";
import "../style/swaplist.scss";
import { LogRefundData } from "../utils/contractLogs";
import { cropString } from "../utils/helper";

const AssetIcon = ({ asset }: { asset: AssetType }) => (
    <span class="swaplist-asset swaplist-asset-single">
        <span data-asset={asset} />
    </span>
);

const SwapListLogs = ({ swaps }: { swaps: Accessor<LogRefundData[]> }) => {
    const navigate = useNavigate();
    const { t } = useGlobalContext();

    const sortedSwaps = createMemo(() => {
        return swaps().sort((a, b) => {
            return a.blockNumber - b.blockNumber;
        });
    });

    return (
        <div class="swaplist">
            <hr />
            <For each={sortedSwaps()}>
                {(swap, index) => (
                    <>
                        <div
                            class="swaplist-item"
                            onClick={() =>
                                navigate(
                                    `/swap/refund/evm/${swap.asset}/${swap.transactionHash}`,
                                )
                            }>
                            <a class="btn-small hidden-mobile" href="#">
                                {t("view")}
                            </a>
                            <AssetIcon asset={swap.asset} />
                            <span class="swaplist-asset-id">
                                {t("id")}:&nbsp;
                                <span class="monospace">
                                    {cropString(swap.transactionHash, 15, 5)}
                                </span>
                            </span>
                            <span class="swaplist-asset-date">
                                {t("created")}:&nbsp;
                                <span class="monospace">
                                    {`${t("block")} ${swap.blockNumber}`}
                                </span>
                            </span>
                        </div>
                        <Show when={index() < sortedSwaps().length - 1}>
                            <hr />
                        </Show>
                    </>
                )}
            </For>
        </div>
    );
};

export default SwapListLogs;