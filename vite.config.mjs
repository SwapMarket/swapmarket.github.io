import * as child from "child_process";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import vitePluginBundleObfuscator from "vite-plugin-bundle-obfuscator";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import solidPlugin from "vite-plugin-solid";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// Only obfuscates production builds ("vite build"); the dev server is
// unaffected. Also skipped when SKIP_OBFUSCATION=true, since obfuscation
// takes several minutes and isn't needed for the throwaway build e2e tests
// run against in CI
const obfuscatorConfig = {
    excludes: [],
    enable: process.env.SKIP_OBFUSCATION !== "true",
    log: true,
    autoExcludeNodeModules: false,
    threadPool: false,
    options: {
        compact: true,
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: false,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: true,
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.5,
        stringArrayEncoding: [],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 2,
        stringArrayWrappersType: "function",
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false,
    },
};

const commitHash = child
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim();

const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf8"),
);

const configFile = path.resolve(__dirname, "src/config.ts");

if (!fs.existsSync(configFile)) {
    console.error(`
❌ Missing configuration file: src/config.ts

Please run one of the following commands to generate a config file:
    - \x1b[36mnpm run mainnet\x1b[0m
    - \x1b[36mnpm run regtest\x1b[0m
    - \x1b[36mnpm run testnet\x1b[0m
    - \x1b[36mnpm run beta\x1b[0m
    - \x1b[36mnpm run pro\x1b[0m
  
Then start the dev server again.
  `);
    process.exit(1);
}

try {
    child.execSync("node index-template-vars.mjs", {
        stdio: "inherit",
    });
} catch (err) {
    console.error("❌ Failed to generate index.html", err);
    process.exit(1);
}

export default defineConfig({
    plugins: [
        solidPlugin(),
        wasm(),
        topLevelAwait(),
        nodePolyfills(),
        vitePluginBundleObfuscator(obfuscatorConfig),
    ],
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
        },
    },
    server: {
        cors: { origin: "*" },
    },
    base: "/",
    build: {
        cssCodeSplit: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
            },
        },
    },
    define: {
        __APP_VERSION__: `"${packageJson.version}"`,
        __GIT_COMMIT__: `"${commitHash}"`,
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./tests/setup.ts",
        pool: "forks",
        server: {
            deps: {
                inline: [/@solidjs\/router/],
            },
        },
    },
});
