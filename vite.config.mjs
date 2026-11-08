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
    // Big third-party libraries that get a chunk of their own (see
    // vendorChunk below): obfuscating them hides nothing of ours, but blows
    // them up several times over, secp256k1-zkp's embedded wasm from 2 MB
    // to 12 MB
    excludes: ["vendor-zkp", /assets\/lib-/],
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
        // generates complaints. Confirmed safe on its own (real production
        // build + headless browser check), unlike selfDefending below
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        // Left off: confirmed via a real production build + headless
        // browser check that enabling this hangs the app before it ever
        // renders (page never reaches domcontentloaded, severely enough to
        // block Playwright's own automation protocol) - a known failure
        // mode where its self-verification misfires against Rollup's
        // cross-chunk wrapping in a code-split, multi-chunk build
        selfDefending: false,
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

// gittr Pages, where the site is mirrored on Nostr, rejects files over 4 MB,
// and obfuscation more than doubles code size. So libraries the app loads at
// startup are packed into chunks of at most ~1 MB of source, instead of all
// landing in the entry bundle. Libraries only loaded on demand (wallets,
// hardware signers) keep Rollup's default chunking, so they still only load
// when needed, but the big ones get a chunk of their own
const maxVendorChunkSize = 1_000_000;
const ownChunkSize = 300_000;

const packageOf = (id) => id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1];

// Whether a module is reachable from an entry point via static imports
const isLoadedAtStartup = (id, getModuleInfo) => {
    const seen = new Set([id]);
    const queue = [id];
    while (queue.length > 0) {
        const info = getModuleInfo(queue.shift());
        if (info?.isEntry) {
            return true;
        }
        for (const importer of info?.importers ?? []) {
            if (!seen.has(importer)) {
                seen.add(importer);
                queue.push(importer);
            }
        }
    }
    return false;
};

// Rollup's helper modules (e.g. "\0commonjsHelpers.js") are packed together
// with the libraries, since those import them
const chunkGroupOf = (id) =>
    packageOf(id) ?? (id.startsWith("\0") ? "\0helpers" : undefined);

// Strongly connected components of a dependency graph (Tarjan), listed
// dependencies first
const dependencyOrder = (graph) => {
    const order = [];
    const stack = [];
    const index = new Map();
    const low = new Map();
    const visit = (node) => {
        index.set(node, index.size);
        low.set(node, index.get(node));
        stack.push(node);
        for (const dep of [...graph.get(node)].sort()) {
            if (!index.has(dep)) {
                visit(dep);
                low.set(node, Math.min(low.get(node), low.get(dep)));
            } else if (stack.includes(dep)) {
                low.set(node, Math.min(low.get(node), index.get(dep)));
            }
        }
        if (low.get(node) === index.get(node)) {
            const component = [];
            let member;
            do {
                member = stack.pop();
                component.push(member);
            } while (member !== node);
            order.push(component);
        }
    };
    for (const node of [...graph.keys()].sort()) {
        if (!index.has(node)) {
            visit(node);
        }
    }
    return order;
};

// Chunk group -> chunk name, computed once per build
let vendorChunkOfGroup;

const planVendorChunks = ({ getModuleIds, getModuleInfo }) => {
    const sizes = new Map();
    const onDemandSizes = new Map();
    const startupModules = [];
    for (const id of getModuleIds()) {
        const group = chunkGroupOf(id);
        if (group === undefined) {
            continue;
        }
        const size = getModuleInfo(id)?.code?.length ?? 0;
        if (isLoadedAtStartup(id, getModuleInfo)) {
            startupModules.push(id);
            sizes.set(group, (sizes.get(group) ?? 0) + size);
        } else {
            onDemandSizes.set(group, (onDemandSizes.get(group) ?? 0) + size);
        }
    }

    const plan = new Map();
    for (const [group, size] of onDemandSizes) {
        if (!sizes.has(group) && size > ownChunkSize) {
            // One chunk per npm scope, since packages of one scope tend to
            // import each other
            plan.set(group, `lib-${group.replace("@", "").split("/")[0]}`);
        }
    }

    // Fill the startup chunks in dependency order, so a chunk only imports
    // from earlier ones. Import cycles between chunks would let a library
    // run before what it depends on, like code using Buffer before its
    // polyfill is set up
    const graph = new Map([...sizes.keys()].map((group) => [group, new Set()]));
    for (const id of startupModules) {
        const group = chunkGroupOf(id);
        for (const imported of getModuleInfo(id)?.importedIds ?? []) {
            const dep = chunkGroupOf(imported);
            if (dep !== group && graph.has(dep)) {
                graph.get(group).add(dep);
            }
        }
    }

    let chunk = 0;
    let used = 0;
    for (const component of dependencyOrder(graph)) {
        const size = component.reduce(
            (sum, group) => sum + sizes.get(group),
            0,
        );
        if (used > 0 && used + size > maxVendorChunkSize) {
            chunk++;
            used = 0;
        }
        used += size;
        for (const group of component) {
            plan.set(group, `vendor-${chunk}`);
        }
    }
    return plan;
};

const vendorChunk = (id, meta) => {
    const group = chunkGroupOf(id);
    if (group === undefined) {
        return undefined;
    }
    if (group === "@vulpemventures/secp256k1-zkp") {
        return "vendor-zkp";
    }
    vendorChunkOfGroup ??= planVendorChunks(meta);
    return vendorChunkOfGroup.get(group);
};

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
        rollupOptions: {
            output: {
                manualChunks: vendorChunk,
            },
        },
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
