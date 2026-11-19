#!/usr/bin/env bash
# Bring a "Build api-auth" run's files into src/wasm/api-auth, after checking each one's attestation, so they can be committed.
# Usage: reproducible/update-api-auth.sh <run id>   Needs gh 2.49 or newer, logged in.
set -euo pipefail
run=${1:?usage: reproducible/update-api-auth.sh <run id>}
repo=$(cd "$(dirname "$0")/.." && pwd)
gh_repo=SwapMarket/swapmarket.github.io
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

[ "$(gh run view "$run" -R "$gh_repo" --json workflowName,conclusion -q '"\(.workflowName) \(.conclusion)"')" = "Build api-auth success" ] \
  || { echo "run $run is not a successful Build api-auth run" >&2; exit 1; }
gh run download "$run" -R "$gh_repo" -n api-auth -D "$work"
for f in api_auth_bg.wasm api_auth.js api_auth.d.ts api_auth_bg.wasm.d.ts package.json; do
  gh attestation verify "$work/$f" --repo "$gh_repo" >/dev/null || { echo "$f has no valid attestation from $gh_repo" >&2; exit 1; }
  cp "$work/$f" "$repo/src/wasm/api-auth/$f"
  echo "attested, copied $f"
done
echo "run $run, commit $(gh run view "$run" -R "$gh_repo" --json headSha -q .headSha | cut -c1-8), api_auth_bg.wasm sha256 $(sha256sum "$repo/src/wasm/api-auth/api_auth_bg.wasm" | cut -d' ' -f1)"
echo "Update the table in src/wasm/api-auth/README.md with that, then commit src/wasm/api-auth."
