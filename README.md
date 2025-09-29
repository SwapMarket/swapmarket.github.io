# SwapMarket

This is a fork of the official Boltz Web App served at
[boltz.exchange](https://boltz.exchange/), which enables **non-custodial** swaps
between different layers of Bitcoin. It adds the ability to list independent
backend APIs in addition to Boltz's, so that a swap client can find a better
deal.

Any node can now run
[boltz-backend](https://github.com/BoltzExchange/boltz-backend) and compete with
Boltz at [SwapMarket](https://swapmarket.github.io).

In addition to potentially lower costs, executing Bitcoin swaps via SwapMarket
reduces centralization in this domain and helps avert regulatory pressure on
Boltz.

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
[Boltz](https://boltz.exchange) itself (unless you self-host their web app).

The web app is static. All your settings, logs and transaction history are
stored only in your browser's cookies and cache. If you wish to shield your IP
address from Github and API backends, you can use any VPN or Tor Browser. We also 
host an [.onion](http://swapmartgsq3pcikacvxc4divxywtqnlin6mmuu2rt42sgyzxky3ssqd.onion)
mirror, but you will sacrifice code transparency when using it. The most
private and secure way is to
[self-host our web app](https://github.com/SwapMarket/swapmarket.github.io/blob/main/docs/index.md).

## Onboarding

Nodes aspiring to become swap providers can apply via
[email](mailto:swapmarket.wizard996@passinbox.com) or by adding their API
details to the
[config file](https://github.com/SwapMarket/swapmarket.github.io/blob/main/src/configs/mainnet.ts)
with a PR. It is obligatory to be contactable and have ample liquidity.

Consult Boltz's
[deployment instructions](https://github.com/BoltzExchange/boltz-backend/blob/master/docs/backend-development.md).
It is easier to start with the
[Testnet mirror](https://swapmarket.github.io/testnet) and your local backend
listening on 127.0.0.1.

## Resources

- Get Help: [Support Center](https://support.boltz.exchange/hc/center/) |
  [Discord](https://discord.gg/QBvZGcW) | [Telegram](https://t.me/boltzhq)
- Read the Docs: [Docs Home](https://docs.boltz.exchange/)
- Read our Blog: [Substack](https://blog.boltz.exchange/)
- Follow us: [X/Twitter](https://twitter.com/Boltzhq) |
  [Nostr](https://primal.net/p/nprofile1qqsqcdcltmv4qanpx3p7svcufdsg9rkk00x7l2sknra4e6whkv59l7clgcdzj)
- Open a Lightning channel with us:
  [CLN](https://amboss.space/node/02d96eadea3d780104449aca5c93461ce67c1564e2e1d73225fa67dd3b997a6018)
  |
  [LND](https://amboss.space/node/026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2)&#x20;
