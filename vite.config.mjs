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
        // Left off: quadruples bundle size, poor cost/benefit vs. the rest
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: false,
        // Real cost: freezes the tab for anyone with devtools open,
        // including legitimate technical users - revert to false if that
        // generates complaints
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.5,
        stringArrayEncoding: ["rc4"],
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

// wasm/api-auth's real output is gitignored (it has secrets baked in), so a
// fresh checkout has nothing at this path for Vite to statically resolve
// the dynamic import in src/lazy/apiAuth.ts against - build/dev/test would
// hard-fail otherwise, for every config, whether or not it even uses
// "authSecretEnv". Stub it in when missing; "npm run build:wasm-auth"
// overwrites this with the real thing when it runs
const wasmAuthDir = path.resolve(__dirname, "src/wasm/api-auth");
const wasmAuthEntry = path.join(wasmAuthDir, "api_auth.js");

if (!fs.existsSync(wasmAuthEntry)) {
    fs.mkdirSync(wasmAuthDir, { recursive: true });
    fs.writeFileSync(
        wasmAuthEntry,
        `export function sign() {
    throw new Error(
        "wasm-auth stub in place - run npm run build:wasm-auth",
    );
}

export default async function init() {
    return undefined;
}
`,
    );
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
