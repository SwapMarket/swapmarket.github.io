import type { Config } from "src/configs/base";
import {
    Explorer,
    arbitrumExplorer,
    arbitrumNetwork,
    baseConfig,
    chooseUrl,
} from "src/configs/base";
import { AssetKind } from "src/consts/AssetKind";

const rskFallback = import.meta.env.VITE_RSK_FALLBACK_ENDPOINT;

const rskRpcUrls = ["https://public-node.rsk.co"];
if (rskFallback) {
    rskRpcUrls.push(rskFallback);
}

const config = {
    ...baseConfig,
    torUrl: "http://swapmartgsq3pcikacvxc4divxywtqnlin6mmuu2rt42sgyzxky3ssqd.onion/",
    network: "mainnet",
    loglevel: "debug",
    backends: [
        {
            alias: "Boltz Exchange",
            apiUrl: {
                normal: "https://api.boltz.exchange",
                tor: "http://boltzzzbnus4m7mta3cxmflnps4fp7dueu2tgurstbvrbt6xswzcocyd.onion/api",
            },
            contact: "https://boltz.exchange",
        },
        {
            alias: "Middle Way",
            apiUrl: {
                normal: "https://api.middleway.space",
                tor: "http://middlwayksj5gak7pgaag32kcslzkjrpois57qtquiydpaqpy5fhzhqd.onion",
            },
            contact: "https://igit.me/middleway",
        },
        {
            alias: "Eldamar",
            apiUrl: {
                normal: "https://boltz-api.eldamar.icu",
                tor: "http://mnyazp2duhs3jewqzw7g6vv44g73ijiujdmk5z6js72fn3epybup2yqd.onion",
            },
            contact: "https://t.me/SynthLock",
        },
        {
            alias: "ZEUS Swaps",
            apiUrl: {
                normal: "https://swaps.zeuslsp.com/api",
                tor: "https://swaps.zeuslsp.com/api",
            },
            contact: "mailto:support@zeusln.com",
        },
    ],
    assets: {
        BTC: {
            type: AssetKind.UTXO,
            blockExplorerUrl: {
                id: Explorer.Mempool,
                normal: "https://mempool.space",
                tor: "http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion",
            },
            blockExplorerApis: [
                {
                    id: Explorer.Esplora,
                    normal: "https://blockstream.info/api",
                    tor: "http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/api",
                },
                {
                    id: Explorer.Mempool,
                    normal: "https://mempool.space/api",
                    tor: "http://mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/api",
                },
            ],
        },
        "L-BTC": {
            type: AssetKind.UTXO,
            blockExplorerUrl: {
                id: Explorer.Esplora,
                normal: "https://blockstream.info/liquid",
                tor: "http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/liquid",
            },
            blockExplorerApis: [
                {
                    id: Explorer.Esplora,
                    normal: "https://blockstream.info/liquid/api",
                    tor: "http://explorerzydxu5ecjrkwceayqybizmpjjznk5izmitf2modhcusuqlid.onion/liquid/api",
                },
                {
                    id: Explorer.Mempool,
                    normal: "https://liquid.network/api",
                    tor: "http://liquidmom47f6s3m53ebfxn47p76a6tlnxib3wp6deux7wuzotdr6cyd.onion/api",
                },
            ],
        },
        RBTC: {
            type: AssetKind.EVMNative,
            blockExplorerUrl: {
                id: Explorer.Blockscout,
                normal: "https://rootstock.blockscout.com",
            },
            network: {
                chainName: "Rootstock",
                symbol: "RBTC",
                chainId: 30,
                rpcUrls: rskRpcUrls,
                nativeCurrency: {
                    name: "RBTC",
                    symbol: "RBTC",
                    decimals: 18,
                },
            },
            rifRelay: "https://boltz.mainnet.relay.rifcomputing.net",
            contracts: {
                deployHeight: 6747215,
                smartWalletFactory:
                    "0x44944a80861120B58cc48B066d57cDAf5eC213dd",
                deployVerifier: "0xc0F5bEF6b20Be41174F826684c663a8635c6A081",
            },
        },
        TBTC: {
            type: AssetKind.ERC20,
            blockExplorerUrl: arbitrumExplorer,
            network: arbitrumNetwork,
            token: {
                address: "0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40",
                decimals: 18,
            },
            contracts: {
                deployHeight: 435848678,
                router: "0x812A4ede94cA28390e05c807A26A9118B5C952A6",
            },
        },
        USDT0: {
            type: AssetKind.ERC20,
            blockExplorerUrl: arbitrumExplorer,
            network: arbitrumNetwork,
            token: {
                address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
                decimals: 6,
                routeVia: "TBTC",
            },
        },
    },
} as Config;

export { config, chooseUrl };
