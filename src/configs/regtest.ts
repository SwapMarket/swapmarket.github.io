import type { Config } from "src/configs/base";
import { Explorer, baseConfig, chooseUrl } from "src/configs/base";

const config = {
    ...baseConfig,
    network: "regtest",
    loglevel: "debug",
    preventReloadOnPendingSwaps: false,
    backends: [
        {
            alias: "Regtest 1",
            apiUrl: {
                normal: "http://localhost:9001",
            },
            contact: "",
        },
        {
            alias: "Regtest 2",
            apiUrl: {
                normal: "http://localhost:9001",
            },
            contact: "",
        },
        {
            alias: "Regtest 3",
            apiUrl: {
                normal: "http://localhost:9002",
            },
            contact: "",
        },
    ],
    assets: {
        BTC: {
            blockExplorerUrl: {
                id: Explorer.Esplora,
                normal: "http://localhost:4002",
            },
            blockExplorerApis: [
                {
                    id: Explorer.Esplora,
                    normal: "http://localhost:4002/api",
                },
            ],
        },
        "L-BTC": {
            blockExplorerUrl: {
                id: Explorer.Esplora,
                normal: "http://localhost:4003",
            },
            blockExplorerApis: [
                {
                    id: Explorer.Esplora,
                    normal: "http://localhost:4003/api",
                },
            ],
        },
        // RSK is disabled and RBTC pairs are removed from this regtest's
        // boltz.conf (contracts aren't deployed in this regtest commit), so
        // there's nothing to swap into/from - keep it out of asset selection
        // until RSK is back
    },
} as Config;

export { config, chooseUrl };
