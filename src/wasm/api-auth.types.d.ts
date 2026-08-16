// Ambient type stub for the wasm-pack output at "./api-auth/api_auth.js"
// (gitignored, only present after "npm run build:wasm-auth"), so tsc can
// resolve the dynamic import in src/lazy/apiAuth.ts without the module
// having actually been built - this file has no secrets, just shapes
declare module "*/wasm/api-auth/api_auth.js" {
    export function sign(
        secretName: string,
        ts: string,
        method: string,
        path: string,
        body: Uint8Array,
    ): Uint8Array;

    const init: (module?: unknown) => Promise<unknown>;
    export default init;
}
