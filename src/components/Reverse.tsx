import { ImArrowDown } from "solid-icons/im";

import { useCreateContext } from "../context/Create";
import { useGlobalContext } from "../context/Global";
import Pair from "../utils/Pair";

const Reverse = () => {
    const { allPairs, regularPairs, backend } = useGlobalContext();
    const { pair, setPair, setOnchainAddress, setInvoice } = useCreateContext();

    const setDirection = () => {
        setOnchainAddress("");
        setInvoice("");
        setPair(
            new Pair(
                allPairs()[backend()],
                pair().toAsset,
                pair().fromAsset,
                regularPairs(),
                backend(),
            ),
        );
    };

    return (
        <button id="flip-assets" onClick={() => setDirection()}>
            <ImArrowDown size={14} />
        </button>
    );
};

export default Reverse;
