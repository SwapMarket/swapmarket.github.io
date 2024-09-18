import { makePersisted } from "@solid-primitives/storage";
import BigNumber from "bignumber.js";
import type { Network as LiquidNetwork } from "liquidjs-lib/src/networks";
import {
    Accessor,
    Setter,
    createContext,
    createEffect,
    createSignal,
    useContext,
} from "solid-js";

import { config } from "../config";
import { BTC, LBTC, LN, RBTC, assets } from "../consts/Assets";
import { Side, SwapType } from "../consts/Enums";
import { DictKey } from "../i18n/i18n";
import { getAddress, getNetwork } from "../utils/compat";
import { getUrlParam, urlParamIsSet } from "../utils/urlParams";

const setDestination = (
    setAssetReceive: Setter<string>,
    setInvoice: Setter<string>,
    setOnchainAddress: Setter<string>,
) => {
    const isValidForAsset = (
        asset: typeof BTC | typeof LBTC,
        address: string,
    ) => {
        try {
            getAddress(asset).toOutputScript(
                address,
                getNetwork(asset) as LiquidNetwork,
            );
            return true;
        } catch (e) {
            return false;
        }
    };

    const destination = getUrlParam("destination");
    if (urlParamIsSet(destination)) {
        if (isValidForAsset(BTC, destination)) {
            setAssetReceive(BTC);
            setOnchainAddress(destination);
            return BTC;
        } else if (isValidForAsset(LBTC, destination)) {
            setAssetReceive(LBTC);
            setOnchainAddress(destination);
            return LBTC;
        } else {
            setAssetReceive(LN);
            setInvoice(destination);
            return LN;
        }
    }

    return undefined;
};

const isValidAsset = (asset: string) =>
    urlParamIsSet(asset) && assets.includes(asset);

const parseAmount = (amount: string): BigNumber | undefined => {
    if (!urlParamIsSet(amount)) {
        return undefined;
    }

    const parsedAmount = new BigNumber(amount);
    if (parsedAmount.isNaN()) {
        return undefined;
    }
    return parsedAmount;
};

const handleUrlParams = (
    setAssetSend: Setter<string>,
    setAssetReceive: Setter<string>,
    setInvoice: Setter<string>,
    setOnchainAddress: Setter<string>,
    setAmountChanged: Setter<Side>,
    setSendAmount: Setter<BigNumber>,
    setReceiveAmount: Setter<BigNumber>,
) => {
    const destinationAsset = setDestination(
        setAssetReceive,
        setInvoice,
        setOnchainAddress,
    );

    const sendAsset = getUrlParam("sendAsset");
    if (isValidAsset(sendAsset)) {
        setAssetSend(sendAsset);
    }

    // The type of the destination takes precedence
    if (destinationAsset === undefined) {
        const receiveAsset = getUrlParam("receiveAsset");
        if (isValidAsset(receiveAsset)) {
            setAssetReceive(receiveAsset);
        }
    }

    // Lightning invoice amounts take precedence
    if (destinationAsset !== LN) {
        const sendAmount = parseAmount(getUrlParam("sendAmount"));
        if (sendAmount) {
            setAmountChanged(Side.Send);
            setSendAmount(sendAmount);
        }

        if (sendAmount === undefined) {
            const receiveAmount = parseAmount(getUrlParam("receiveAmount"));

            if (receiveAmount) {
                setAmountChanged(Side.Receive);
                setReceiveAmount(BigNumber(receiveAmount));
            }
        }
    }
};

export type CreateContextType = {
    swapType: Accessor<SwapType>;
    invoice: Accessor<string>;
    setInvoice: Setter<string>;
    lnurl: Accessor<string>;
    setLnurl: Setter<string>;
    onchainAddress: Accessor<string>;
    setOnchainAddress: Setter<string>;
    assetSend: Accessor<string>;
    setAssetSend: Setter<string>;
    assetReceive: Accessor<string>;
    setAssetReceive: Setter<string>;
    assetSelect: Accessor<boolean>;
    setAssetSelect: Setter<boolean>;
    assetSelected: Accessor<string>;
    setAssetSelected: Setter<string>;
    backendSelect: Accessor<boolean>;
    setBackendSelect: Setter<boolean>;
    valid: Accessor<boolean>;
    setValid: Setter<boolean>;
    invoiceValid: Accessor<boolean>;
    setInvoiceValid: Setter<boolean>;
    addressValid: Accessor<boolean>;
    setAddressValid: Setter<boolean>;
    amountValid: Accessor<boolean>;
    setAmountValid: Setter<boolean>;
    pairValid: Accessor<boolean>;
    setPairValid: Setter<boolean>;
    sendAmount: Accessor<BigNumber>;
    setSendAmount: Setter<BigNumber>;
    receiveAmount: Accessor<BigNumber>;
    setReceiveAmount: Setter<BigNumber>;
    sendAmountFormatted: Accessor<string>;
    setSendAmountFormatted: Setter<string>;
    receiveAmountFormatted: Accessor<string>;
    setReceiveAmountFormatted: Setter<string>;
    amountChanged: Accessor<Side>;
    setAmountChanged: Setter<Side>;
    minimum: Accessor<number>;
    setMinimum: Setter<number>;
    maximum: Accessor<number>;
    setMaximum: Setter<number>;
    boltzFee: Accessor<number>;
    setBoltzFee: Setter<number>;
    minerFee: Accessor<number>;
    setMinerFee: Setter<number>;
    setInvoiceError: Setter<DictKey>;
    invoiceError: Accessor<DictKey>;
};

const CreateContext = createContext<CreateContextType>();

const CreateProvider = (props: { children: any }) => {
    const defaultSelection = Object.keys(config.assets)[0];

    const [swapType, setSwapType] = createSignal<SwapType>(SwapType.Submarine);
    const [invoice, setInvoice] = createSignal<string>("");
    const [lnurl, setLnurl] = createSignal("");
    const [onchainAddress, setOnchainAddress] = createSignal("");

    const [assetReceive, setAssetReceive] = makePersisted(
        createSignal(defaultSelection),
        { name: "assetReceive" },
    );

    const [assetSend, setAssetSend] = makePersisted(createSignal(LN), {
        name: "assetSend",
    });

    createEffect(() => {
        if (assetReceive() === LN) {
            setSwapType(SwapType.Submarine);
        } else if (assetSend() === LN) {
            setSwapType(SwapType.Reverse);
        } else {
            setSwapType(SwapType.Chain);
        }
    });

    // asset selection
    const [assetSelect, setAssetSelect] = createSignal(false);
    const [assetSelected, setAssetSelected] = createSignal(null);

    // validation
    const [valid, setValid] = createSignal(false);
    const [invoiceValid, setInvoiceValid] = createSignal(false);
    const [addressValid, setAddressValid] = createSignal(false);
    const [amountValid, setAmountValid] = createSignal(false);
    const [pairValid, setPairValid] = createSignal(true);
    const [invoiceError, setInvoiceError] = createSignal<DictKey | undefined>(
        undefined,
    );

    createEffect(() => {
        if (amountValid() && pairValid()) {
            if (
                (swapType() !== SwapType.Submarine && addressValid()) ||
                (swapType() === SwapType.Submarine &&
                    invoiceValid() &&
                    (assetReceive() !== RBTC || addressValid()))
            ) {
                setValid(true);
                return;
            }
        }
        setValid(false);
    });

    // amounts
    const [sendAmount, setSendAmount] = createSignal(BigNumber(0));
    const [receiveAmount, setReceiveAmount] = createSignal(BigNumber(0));
    const [sendAmountFormatted, setSendAmountFormatted] = createSignal("0");
    const [receiveAmountFormatted, setReceiveAmountFormatted] =
        createSignal("0");

    const [amountChanged, setAmountChanged] = createSignal(Side.Send);
    const [minimum, setMinimum] = createSignal<number>(0);
    const [maximum, setMaximum] = createSignal<number>(0);

    // fees
    const [boltzFee, setBoltzFee] = createSignal(0);
    const [minerFee, setMinerFee] = createSignal(0);

    // backend selection
    const [backendSelect, setBackendSelect] = createSignal(false);

    handleUrlParams(
        setAssetSend,
        setAssetReceive,
        setInvoice,
        setOnchainAddress,
        setAmountChanged,
        setSendAmount,
        setReceiveAmount,
    );

    return (
        <CreateContext.Provider
            value={{
                swapType,
                invoice,
                setInvoice,
                lnurl,
                setLnurl,
                onchainAddress,
                setOnchainAddress,
                assetSend,
                setAssetSend,
                assetReceive,
                setAssetReceive,
                assetSelect,
                setAssetSelect,
                assetSelected,
                setAssetSelected,
                backendSelect,
                setBackendSelect,
                valid,
                setValid,
                invoiceValid,
                setInvoiceValid,
                addressValid,
                setAddressValid,
                amountValid,
                setAmountValid,
                pairValid,
                setPairValid,
                sendAmount,
                setSendAmount,
                receiveAmount,
                setReceiveAmount,
                sendAmountFormatted,
                setSendAmountFormatted,
                receiveAmountFormatted,
                setReceiveAmountFormatted,
                amountChanged,
                setAmountChanged,
                minimum,
                setMinimum,
                maximum,
                setMaximum,
                boltzFee,
                setBoltzFee,
                minerFee,
                setMinerFee,
                invoiceError,
                setInvoiceError,
            }}>
            {props.children}
        </CreateContext.Provider>
    );
};

const useCreateContext = () => {
    const context = useContext(CreateContext);
    if (!context) {
        throw new Error("useCreateContext: cannot find a CreateContext");
    }
    return context;
};

export { useCreateContext, CreateProvider };
