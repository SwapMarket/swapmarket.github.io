import Loader from "./Loader";

// Built by "npm run build:wasm-auth". Not built by default, so this import
// throws for anyone who hasn't run that script
export default new Loader("API auth", async () => {
    const wasm = await import("../wasm/api-auth/api_auth.js");
    await wasm.default();
    return wasm;
});
