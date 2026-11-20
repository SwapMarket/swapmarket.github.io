#!/usr/bin/env bash
# Check the published app against its source: read the commit the site says it is (index.html's build-commit), rebuild that
# commit in the pinned image (reproducible/build-page.sh), and compare every file the site serves with the rebuild, byte for byte.
# Usage: ./check-page.sh [SITE_URL]   (default https://swapmarket.github.io/; the nsite's address works too)
# Needs Docker, curl, and this repository with that commit fetched (it fetches if needed). With gh 2.49 or newer, logged in, it
# also checks the attestation of the one file no one else can rebuild, the api-auth module (src/wasm/api-auth/README.md).
set -euo pipefail

site=${1:-https://swapmarket.github.io/}
site=${site%/}/
repo=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

curl -fsSL -o "$work/index.html" "${site}index.html"
commit=$(grep -o '<meta name="build-commit" content="[0-9a-f]\{40\}"' "$work/index.html" | grep -o '[0-9a-f]\{40\}' || true)
[ -n "$commit" ] || { echo "the site names no build commit (it predates reproducible builds)" >&2; exit 1; }
echo "the site says it is commit $commit"
git -C "$repo" rev-parse --verify -q "$commit^{commit}" >/dev/null || git -C "$repo" fetch -q origin
echo "rebuilding it in the pinned image, which takes several minutes the first time"
"$repo/reproducible/build-page.sh" "$commit" "$work/built" >/dev/null 2>"$work/build.log" || {
  tail -n 30 "$work/build.log" >&2; echo "the rebuild failed" >&2; exit 1; }

# A copy on Nostr has neither the docs, which stay on GitHub Pages, nor SHA256SUMS, since NIP-5A paths need an extension.
copy=0
[ "$site" = "https://swapmarket.github.io/" ] || copy=1
bad=0
while read -r want file; do
  file=${file#./}
  if ! curl -fsSL -o "$work/live" "$site$file"; then
    if [ "$copy" = 1 ] && [[ $file == docs/* ]]; then continue; fi
    echo "MISSING $file"; bad=1; continue
  fi
  if [ "$(sha256sum "$work/live" | cut -d' ' -f1)" = "$want" ]; then echo "same    $file"; else echo "DIFFERS $file"; bad=1; fi
done < "$work/built/SHA256SUMS"
if [ "$copy" = 0 ]; then
  if curl -fsSL -o "$work/live" "${site}SHA256SUMS" && cmp -s "$work/live" "$work/built/SHA256SUMS"; then echo "same    SHA256SUMS"
  else echo "DIFFERS SHA256SUMS"; bad=1; fi
fi

# The api-auth module is committed as built by a workflow that has the secret; its attestation ties it to this repository.
if gh attestation --help >/dev/null 2>&1; then
  for wasm in "$work"/built/assets/api_auth_bg-*.wasm; do
    if gh attestation verify "$wasm" --repo SwapMarket/swapmarket.github.io >/dev/null 2>&1; then echo "attested ${wasm#"$work/built/"}"
    else echo "NOT ATTESTED ${wasm#"$work/built/"}"; bad=1; fi
  done
else
  echo "skipped: the api-auth module's attestation (needs gh 2.49 or newer)"
fi

if [ "$bad" = 0 ]; then echo "the site is exactly commit $commit, rebuilt here"; else
  echo "the site is NOT what commit $commit builds" >&2; exit 1; fi
