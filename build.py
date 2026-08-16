#!/usr/bin/env python3

import os
import sys


def handle_coop_disabled():
    print("Cooperative signatures are disabled in config")
    sys.exit(1)


network: str | None = None
needs_wasm_auth = False

with open("./src/config.ts", "r") as f:
    for line in f:
        if "cooperativeDisabled" in line:
            if "false" not in line:
                handle_coop_disabled()

        if "network:" in line and '"' in line:
            network = line.split(":")[1].strip().strip('"').strip('",')

        if "authSecretEnv" in line:
            needs_wasm_auth = True

if needs_wasm_auth and not os.path.exists("./src/wasm/api-auth/api_auth_bg.wasm"):
    print(
        'WARN: config has a backend with "authSecretEnv" set, but the wasm '
        'signing module isn\'t built - run "npm run build:wasm-auth" first, '
        "or requests to that backend will fail at runtime"
    )

# .env file is not required on regtest
if network != "regtest":
    try:
        with open(".env", "r") as f:
            data = f.read()

            for var in [
                "VITE_RSK_LOG_SCAN_ENDPOINT",
                "VITE_RSK_FALLBACK_ENDPOINT",
                "VITE_WALLETCONNECT_PROJECT_ID",
                "VITE_CHATWOOT_TOKEN",
            ]:
                if var not in data:
                    print(f"WARN: {var} not in .env file")

    except Exception as e:
        print("WARN: could not open .env file:", e)
