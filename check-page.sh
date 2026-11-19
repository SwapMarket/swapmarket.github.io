#!/usr/bin/env bash
# Check the published app against its GitHub build. The build compiles in a secret, so no one else can rebuild it byte for byte;
# instead, each file is tied to this repository by the build's attestation ("Attest build provenance" in .github/workflows/deploy
# main.yml), signed through GitHub's Sigstore.
#
# The file list is the latest successful "Deploy main" build (its app-dist artifact), since the app's code is obfuscated and names
# the files it loads only at run time. Every one of them is fetched from the site and must be attested, and the same as that build.
# A changed file fails, and a file the build doesn't have can only be loaded by changing one it does.
#
# Usage: ./check-page.sh [SITE_URL]   (default https://swapmarket.github.io/; the nsite's address works too, and has no docs)
# Needs curl and gh, logged in. With gh 2.49 or newer each attestation's signature is verified (gh attestation verify). With an
# older gh it only asks GitHub's API whether it holds an attestation for each file's hash, which trusts GitHub's answer, and says so.
set -euo pipefail

site=${1:-https://swapmarket.github.io/}
site=${site%/}/
gh_repo=SwapMarket/swapmarket.github.io
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

if gh attestation --help >/dev/null 2>&1; then verify=signature; else
  verify=api
  echo "this gh has no 'attestation' command (it needs 2.49 or newer), so only GitHub's API is asked, and no signature is checked"
fi

read -r run sha < <(gh run list -R "$gh_repo" -w "Deploy main" -s success -L 1 --json databaseId,headSha -q '.[0] | "\(.databaseId) \(.headSha)"') || true
[ -n "${run:-}" ] || { echo "no successful run of Deploy main" >&2; exit 1; }
echo "the latest build: run $run, commit ${sha::12}"
gh run download "$run" -R "$gh_repo" -n app-dist -D "$work/build"

bad=0 n=0
while IFS= read -r -d '' f; do
  rel=${f#"$work/build/"}
  n=$((n + 1))
  if ! curl -fsSL -o "$work/live" "$site$rel"; then echo "MISSING      $rel"; bad=1; continue; fi
  if ! cmp -s "$work/live" "$f"; then echo "DIFFERS      $rel"; bad=1; continue; fi
  if [ "$verify" = signature ]; then
    gh attestation verify "$work/live" --repo "$gh_repo" >/dev/null 2>&1 && ok=1 || ok=0
  else
    digest=$(sha256sum "$work/live" | cut -d' ' -f1)
    [ "$(gh api "/repos/$gh_repo/attestations/sha256:$digest" -q '.attestations | length' 2>/dev/null || echo 0)" -gt 0 ] && ok=1 || ok=0
  fi
  if [ "$ok" = 1 ]; then echo "same, attested $rel"; else echo "NOT ATTESTED $rel"; bad=1; fi
done < <(find "$work/build" -type f -not -path "$work/build/docs/*" -print0 | sort -z)

if [ "$bad" = 0 ]; then echo "all $n files at $site are commit ${sha::12}'s build, attested by $gh_repo ($verify check)"; else
  echo "$site is NOT exactly commit ${sha::12}'s attested build (if a deploy is running, try again when it is done)" >&2; exit 1; fi
