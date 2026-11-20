# SwapMarket

This is a fork of the official Boltz Web App that used to be served at
boltz.exchange, which enabled **non-custodial** swaps between different layers
of Bitcoin. Our fork adds the ability to list independent backend APIs, so that
a swap client can find a better deal.

Any node can now run
[boltz-backend](https://github.com/SwapMarket/boltz-backend) and compete at
[SwapMarket](https://swapmarket.github.io).

In addition to potentially lower costs, executing Bitcoin swaps via SwapMarket
reduces centralization in this domain and helps avert regulatory pressure on the
swap providers.

## Is this legal?

Boltz's
[AGPL-3.0 license](https://github.com/BoltzExchange/boltz-web-app/blob/main/LICENSE)
permits modifying and running its source code as long as it remains public.

## Is this safe?

All the swaps are atomic. Both legs use the same preimage and will either settle
or fail together. Your keys never leave your wallet, which makes the exchange
non-custodial.

A backend cannot cheat. Invoices and addresses it submits are
[validated](https://github.com/SwapMarket/swapmarket.github.io/blob/dbc5ab9684c26cafa4a35ac49f9f2c8475ce5fb3/src/components/AddressInput.tsx#L28)
by the frontend before displaying to the user. An evil backend would require
cooperation from an evil frontend to bypass these checks.

Running our frontend as a Github Page makes it verifiably not evil. The code is
hosted, built and deployed publicly. Github
[attests](https://github.com/SwapMarket/swapmarket.github.io/attestations) build
provenance upon deployment. This makes our swaps completely trustless, unlike
the original Boltz itself (unless you self-hosted their web app).

The build is also reproducible: anyone can rebuild a deployed commit and get the
same bytes as the live site. See
[How to verify the site](#how-to-verify-the-site).

The web app is static. All your settings, logs and transaction history are
stored only in your browser's cookies and cache. If you wish to shield your IP
address from Github and API backends, you can use any VPN or Tor Browser. We
also host an
[.onion](http://swapmartgsq3pcikacvxc4divxywtqnlin6mmuu2rt42sgyzxky3ssqd.onion)
and a [Nostr](https://npub1xhklzztd83v34zsf9da2gvfrctj5wcsvsx09er9v26jy7r0uq8yq4vme7d.nwb.tf) mirror.

## How to verify the site

You need Docker, git and curl, plus the GitHub CLI (`gh`) 2.49 or newer, logged
in, for the last step.

1. Clone this repository:
   `git clone https://github.com/SwapMarket/swapmarket.github.io && cd swapmarket.github.io`
2. Run `./check-page.sh`. It reads the commit the live site names in its
   `index.html`, rebuilds that commit in a pinned container
   (`reproducible/build-page.sh`), and compares every file the site serves with
   the rebuild, byte for byte. The first run takes several minutes.
3. To check a copy on Nostr instead, give its address:
   `./check-page.sh https://npub1xhklzztd83v34zsf9da2gvfrctj5wcsvsx09er9v26jy7r0uq8yq4vme7d.nwb.tf/`
4. One file can't be rebuilt without a secret: the api-auth module, which signs
   requests to the Middle Way backend. It is committed in `src/wasm/api-auth`,
   built by the "Build api-auth" workflow, which has the secret. With `gh`, the
   script checks that module's attestation, which ties it to this repository.

It ends with "the site is exactly commit …, rebuilt here", or lists each file
that is missing or different. Details are in
[reproducible/README.md](reproducible/README.md).

## Onboarding

Nodes aspiring to become swap providers can apply via
[email](mailto:swapmarket.wizard996@passinbox.com) or by adding their API
details to the
[config file](https://github.com/SwapMarket/swapmarket.github.io/blob/main/src/configs/mainnet.ts)
with a PR. It is obligatory to be contactable and have ample liquidity.

Consult
[deployment instructions](https://github.com/SwapMarket/boltz-backend/blob/master/docs/backend-development.md)
and the [Regtest stack](https://github.com/SwapMarket/regtest) used in CI. It
may be easier to start with our
[Testnet mirror](https://swapmarket.github.io/testnet) and your local backend
listening on 127.0.0.1.

## Resources

- Read our Docs: [Docs Home](https://swapmarket.github.io/docs/)
- Follow SwapMarket:
  [Nostr](https://primal.net/p/nprofile1qqsrtm03p9knckg63gyjk74yxy3u9e28vgxgr8ju3jk9dfz0ph7qrjqftumaf)
  [Stacker News](https://stacker.news/SwapMarket/all)
