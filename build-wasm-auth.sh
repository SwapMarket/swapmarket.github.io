#!/usr/bin/env bash
set -euo pipefail

# Builds wasm/api-auth, baking any configured VITE_API_AUTH_SECRET* values
# into the compiled .wasm at build time. In CI those are already real
# process env vars (set on the Build step); locally, load them from .env the
# same way Vite itself does, so this "just works" without extra setup
cd "$(dirname "$0")"

if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
fi

cd wasm/api-auth
cargo clean
# Some environments set a native-target RUSTFLAGS (e.g. -fuse-ld=lld) that
# rust-lld rejects when it's the linker itself, as it is for wasm32
env RUSTFLAGS='' wasm-pack build --target web --out-dir ../../src/wasm/api-auth --release
