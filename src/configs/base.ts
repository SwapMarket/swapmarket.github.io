import type log from "loglevel";

import type Backend from "../components/Backend";
import { type AssetKind } from "../consts/AssetKind";
import { Network } from "../consts/Network";

export type Asset = {
    type: AssetKind;

    blockExplorerUrl?: ExplorerUrl;
    blockExplorerApis?: ExplorerUrl[];

    rifRelay?: string;
    contracts?: {
        deployHeight: number;
        router?: string;
        smartWalletFactory?: string;
        deployVerifier?: string;
    };
    network?: {
        chainName: string;
        symbol: string;
        chainId: number;
        rpcUrls: string[];
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
    };
    token?: {
        address: string;
        decimals: number;
        routeVia?: string;
    };
};

export enum Explorer {
    Mempool = "mempool",
    Esplora = "esplora",
    Blockscout = "blockscout",
}

export type Url = {
    normal: string;
    tor?: string;
};

export type ExplorerUrl = Url & {
    id: Explorer;
};

type Backend = {
    alias: string;
    apiUrl: Url;
    contact: string;
};

export type Config = {
    network?: "mainnet" | "testnet" | "regtest";
    backends?: Backend[];
    isBoltzClient?: boolean;
    boltzClientApiUrl?: string;
    isBeta?: boolean;
    isPro?: boolean;
    assets?: Record<string, Asset>;
    torUrl?: string;
} & typeof defaults;

export const arbitrumExplorer = {
    id: Explorer.Blockscout,
    normal: "https://arbiscan.io",
};

export const arbitrumNetwork = {
    symbol: "ARB",
    chainName: Network.Arbitrum,
    chainId: 42161,
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
    },
};

const defaults = {
    // Disables API endpoints that create cooperative signatures for claim
    // and refund transactions
    // **Should only be enabled for testing purposes**
    cooperativeDisabled: false,

    preventReloadOnPendingSwaps: true,

    loglevel: "info" as log.LogLevelDesc,
    defaultLanguage: "en",
    supportUrl: "https://support.boltz.exchange/hc/center",
    discordUrl: "",
    githubUrl: "https://github.com/SwapMarket",
    repoUrl: "https://github.com/SwapMarket/swapmarket.github.io",
    docsUrl:
        "https://github.com/SwapMarket/swapmarket.github.io/blob/main/README.md",
    tetherUrl: "",
    partnerUrl: "https://partner.boltz.exchange",
    nostrUrl: "https://iris.to/swapmarket",
    statusUrl: "https://status.boltz.exchange",
    testnetUrl: "https://swapmarket.github.io/testnet/",
    regtestUrl: "https://github.com/BoltzExchange/regtest/",
    email: "swapmarket.wizard996@passinbox.com",
    dnsOverHttps: "https://1.1.1.1/dns-query",
    chatwootUrl: "https://support.boltz.exchange",
    preimageValidation: "https://validate-payment.com",
    simplexUrl:
        "https://smp14.simplex.im/a#_wHsmPckmoIeIKZ2WmKs6nrSSH_bbnb3Lj3voA8UO7k",
    rateProviders: {
        Yadio: "https://api.yadio.io/exrates/btc",
        Kraken: "https://api.kraken.com/0/public/Ticker",
        Mempool: "https://mempool.space/api/v1/prices",
    },
};

const isTor = () => window?.location.hostname.endsWith(".onion");

const chooseUrl = (url?: Url) =>
    url ? (isTor() && url.tor ? url.tor : url.normal) : undefined;

const baseConfig: Config = defaults;

export { baseConfig, chooseUrl };
