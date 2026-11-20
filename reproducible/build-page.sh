#!/usr/bin/env bash
# Build the site exactly as published, from one commit, in the pinned image (reproducible/Dockerfile). Anyone with Docker gets the
# same bytes, and so the same SHA256SUMS, as the site. Usage: reproducible/build-page.sh [COMMIT] OUT   (COMMIT defaults to HEAD)
# Only what the commit holds is built: uncommitted changes are left out. Packages download inside the container, checked against
# package-lock.json.
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
if [ $# -eq 2 ]; then commit=$1 out=$2; elif [ $# -eq 1 ]; then commit=HEAD out=$1; else
  echo "usage: reproducible/build-page.sh [COMMIT] OUT" >&2; exit 2
fi
[ ! -e "$out" ] || { echo "$out exists already" >&2; exit 1; }
full=$(git -C "$repo" rev-parse --verify "$commit^{commit}")

# The image comes from the commit's own recipe, so an old commit builds with the tools it was published with.
ctx=$(mktemp -d)
trap 'rm -rf "$ctx"' EXIT
git -C "$repo" archive "$full" reproducible | tar -x -C "$ctx"
recipe=$(cat "$ctx/reproducible/Dockerfile" "$ctx/reproducible/build-inside.sh" | sha256sum | cut -c1-16)
image="swapmarket-site-builder:$recipe"
if ! docker image inspect "$image" >/dev/null 2>&1; then
  docker build -q --platform linux/amd64 -t "$image" "$ctx/reproducible" >/dev/null
fi

mkdir -p "$out"
git -C "$repo" archive "$full" | docker run --rm -i --platform linux/amd64 "$image" "$full" | tar -x -C "$out"
echo "built ${full::12} into $out" >&2
cat "$out/SHA256SUMS"
