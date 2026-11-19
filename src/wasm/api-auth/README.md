# The built api-auth module

`wasm/api-auth` signs requests to backends that need an API secret (Middle Way).
Its build bakes the secret in, masked with random bytes, so no one without the
secret can rebuild it. It is built once per secret, by the **Build api-auth**
workflow (`.github/workflows/build api-auth.yml`), which has the secret and
attests what it builds, and committed here. The site's own build then needs no
secret, and anyone can rebuild the site byte for byte
(`reproducible/README.md`).

What is committed here is what every visitor downloads anyway: the masked secret
is in the public `.wasm`.

## Where these files came from

| File                                    | From                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api_auth_bg.wasm`                      | The **Deploy main** run 44626000971 (commit 4487e704, 2026-11-19), as served at `/assets/api_auth_bg-CQY2qqJ8.wasm`. sha256 `5c3d81844a7633d693db05ef76543de1bd4f4aec8c72c528982db3304045da8c`. Check its attestation: `gh attestation verify src/wasm/api-auth/api_auth_bg.wasm --repo SwapMarket/swapmarket.github.io` |
| `api_auth.js`, `*.d.ts`, `package.json` | `wasm-pack build --target web --release` (wasm-pack 0.13.1, wasm-bindgen 0.2.127 from `wasm/api-auth/Cargo.lock`). They don't depend on the secret: two builds with different secrets give the same files, and only the `.wasm` differs.                                                                                 |

## Updating it (a new secret, or a change to wasm/api-auth)

1. Set the secret (`VITE_API_AUTH_SECRET_MIDDLEWAY`) in the repository's Actions
   secrets.
2. Run **Build api-auth** from the Actions tab, on `main` or `test`.
3. `./reproducible/update-api-auth.sh <run id>` downloads its files, checks each
   one's attestation, and puts them here. Commit them.
