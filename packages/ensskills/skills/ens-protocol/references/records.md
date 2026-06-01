# Records

Definitions follow the [ENSNode Terminology reference](https://ensnode.io/docs/reference/terminology).

A name's **resolver** stores its records. The common record types are stable across the protocol.

## Address records

The chain address(es) a name points to, keyed by a numeric **coinType** (see
[resolution.md](resolution.md#multichain-addresses-cointypes)). A single name can hold a different
address per chain — `60` is Ethereum mainnet. An address record may also be **unset/null** for a
given coinType; that is distinct from "the name doesn't exist."

In code, validate/normalize an address with `enssdk`'s `toNormalizedAddress` (throws on invalid) or
`isNormalizedAddress`, and compare normalized values — never raw, mixed-case strings.

## Text records (ENSIP-5)

Arbitrary key → string values ([ENSIP-5](https://docs.ens.domains/ensip/5)). Commonly used keys:

- `avatar` — profile image (see below)
- `description`, `url`, `location`, `email`
- service handles: `com.twitter`, `com.github`, `org.telegram`, `com.discord`, …

Keys are conventions, not an enum — a resolver can store any key.

## Avatars (ENSIP-12)

The `avatar` text record is a URI that may be `https://`, `ipfs://`, `data:`, or an `eip155:` NFT
reference ([ENSIP-12](https://docs.ens.domains/ensip/12)). Rendering it as a plain `<img src>` is
wrong — the scheme must be resolved, and for NFT avatars ownership should be verified before display.

## Contenthash (ENSIP-7)

A pointer to decentralized content ([ENSIP-7](https://docs.ens.domains/ensip/7)) — IPFS, Arweave,
Swarm, etc. This is what lets `name.eth` serve a website via ENS-aware gateways/browsers.

## Other records

Resolvers may also expose ABI records, public keys, and arbitrary on-chain data. These follow their
own ENSIPs and are less commonly needed; consult the [ENSIPs](https://docs.ens.domains/ensips) when a
task calls for them.
