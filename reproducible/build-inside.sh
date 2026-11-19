#!/usr/bin/env bash
# Runs inside the image: reads one commit's `git archive` on stdin, builds the site as the deploy publishes it (mainnet config, the
# app and the docs), writes SHA256SUMS, and writes the site as a tar on stdout. Everything else goes to stderr.
# Usage: git archive <commit> | docker run --rm -i <image> <full commit>
set -euo pipefail
commit=${1:?usage: build-inside.sh <full commit>}

mkdir -p /build/src
tar -x -C /build/src
cd /build/src
{
  # Exactly the packages package-lock.json records, each checked against its hash; no install scripts.
  npm ci --ignore-scripts --no-audit --no-fund
  npm run mainnet
  # The same environment the deploy used before it was reproducible.
  GIT_COMMIT=$commit VITE_RSK_LOG_SCAN_ENDPOINT="" npm run build
  npx vitepress build docs --outDir dist/docs
  (cd dist && find . -type f ! -name SHA256SUMS -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > SHA256SUMS)
} >&2
tar -C dist -c --sort=name --mtime=@0 --owner=0 --group=0 --numeric-owner .
