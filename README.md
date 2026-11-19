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

To check the live app yourself, run `./check-page.sh` (or
`./check-page.sh <address>` for a copy, such as the nsite at
`https://npub1xhklzztd83v34zsf9da2gvfrctj5wcsvsx09er9v26jy7r0uq8yq4vme7d.nwb.tf/`).
It takes the file list from the latest "Deploy main" build, fetches every file
from the site, and checks that each one is that build's and is attested by this
repository. It needs curl and the GitHub CLI (`gh`), logged in; with gh 2.49 or
newer it also verifies each attestation's signature, and with an older one it
only asks GitHub's API.

The web app is static. All your settings, logs and transaction history are
stored only in your browser's cookies and cache. If you wish to shield your IP
address from Github and API backends, you can use any VPN or Tor Browser. We
also host an
[.onion](http://swapmartgsq3pcikacvxc4divxywtqnlin6mmuu2rt42sgyzxky3ssqd.onion)
mirror, but you will sacrifice code transparency when using it. The most private
and secure way is to
[self-host our web app](https://swapmarket.github.io/docs/).

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
