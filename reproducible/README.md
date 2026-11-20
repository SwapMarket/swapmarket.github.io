# Reproducible site build

The site at https://swapmarket.github.io/ is built here, in a container pinned
to exact tools, so anyone can rebuild it from the commit it names and get the
same bytes.

- `Dockerfile`: Node 24.22.1 on Debian bookworm, pinned by image digest, always
  `linux/amd64`.
- `build-inside.sh`: builds one commit's `git archive` with the mainnet config:
  `npm ci` (exactly the packages in `package-lock.json`, checked against their
  hashes, no install scripts), the app, and the docs into `docs/`. Then it
  writes `SHA256SUMS`.
- `build-page.sh [COMMIT] OUT`: builds the image from the commit's own recipe,
  and runs the build.
- `update-api-auth.sh <run id>`: brings a new api-auth module into the
  repository (below).

What makes it reproducible:

- the JavaScript obfuscator has a fixed seed (`vite.config.mjs`);
- the commit comes from `GIT_COMMIT` rather than from git, and goes into
  `index.html` as `<meta name="build-commit">`;
- the one part that needs a secret, the api-auth module, is committed rather
  than built (`src/wasm/api-auth/README.md`).

The deploy (`.github/workflows/deploy main.yml`) runs `build-page.sh` twice, on
two machines, and deploys only if both agree byte for byte. It also attests
every file.

## Check the live site

With Docker and this repository:

```sh
./check-page.sh                     # https://swapmarket.github.io/
./check-page.sh <nsite address>     # a copy on Nostr, such as https://npub1xhklzztd83v34zsf9da2gvfrctj5wcsvsx09er9v26jy7r0uq8yq4vme7d.nwb.tf/
```

It reads the commit from the site's `index.html`, rebuilds it with
`build-page.sh`, and compares every file the site serves with the rebuild. A
copy on Nostr has no docs and no `SHA256SUMS`, so those are skipped there.

The api-auth module can't be rebuilt without the secret. With `gh` 2.49 or
newer, logged in, the script also checks that module's attestation, which ties
it to this repository's workflows.

## Limits

- It trusts the pinned image, npm's registry checksums in `package-lock.json`,
  and, for the api-auth module, GitHub's attestation.
- Sites deployed before reproducible builds name no build commit, so they can't
  be checked this way.
