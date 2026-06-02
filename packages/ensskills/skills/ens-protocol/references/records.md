# Records

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology).

A name's **resolver** (its _effective_ resolver — see [architecture.md](architecture.md)) stores its records. Each record type is defined by its own standard and is stable across the protocol. Any record can be **unset/null** — that is distinct from "the name doesn't exist" or "the name isn't resolvable." Reading records is ENS Forward Resolution; in practice resolve through the protocol or the omnigraph rather than reading a resolver contract directly.

## Address records (ENSIP-9, ENSIP-11)

The chain address(es) a name points to. Originally a single Ethereum address (`addr(node)`, ENSIP-1 / EIP-137); **multichain** addresses (`addr(node, coinType)`, [ENSIP-9](https://docs.ens.domains/ensip/9) / EIP-2304) let one name hold a different address per chain, keyed by a numeric **coinType** (see [resolution.md](resolution.md#multichain-addresses-cointypes)). Non-EVM coinTypes follow SLIP-44; EVM chains derive their coinType from the chain id per [ENSIP-11](https://docs.ens.domains/ensip/11). Ethereum mainnet is coinType `60`.

In code, validate/normalize an address with `enssdk`'s `toNormalizedAddress` (throws on invalid) or `isNormalizedAddress`, and compare normalized values — never raw, mixed-case strings.

## Text records (ENSIP-5)

Arbitrary key → string values (`text(node, key)`, [ENSIP-5](https://docs.ens.domains/ensip/5) / EIP-634). Keys are conventions, not an enum — a resolver can store any key. Standardized **global keys**: `avatar`, `description`, `display`, `email`, `keywords`, `mail`, `notice`, `location`, `phone`, `url`; `header` (banner image) is [ENSIP-18](https://docs.ens.domains/ensip/18). **Service keys** use reverse-DNS notation: `com.twitter`, `com.github`, `com.discord`, `com.linkedin`, `org.telegram`, `io.keybase`, etc.

## Avatar (ENSIP-12)

The `avatar` text record is a URI, not a plain image URL ([ENSIP-12](https://docs.ens.domains/ensip/12)). It may be `https://`, `ipfs://`, `data:`, or an `eip155:` NFT reference. Rendering it as a bare `<img src>` is wrong — the scheme must be resolved, and for NFT avatars ownership should be verified before display.

## Contenthash (ENSIP-7)

A pointer to decentralized content (`contenthash(node)`, [ENSIP-7](https://docs.ens.domains/ensip/7) / EIP-1577) — IPFS, Arweave, Swarm, etc. This is what lets `name.eth` serve a website via ENS-aware gateways and browsers.

## ABI records (ENSIP-4)

A contract ABI stored under the name (`ABI(node, contentTypes)`, [ENSIP-4](https://docs.ens.domains/ensip/4) / EIP-205). `contentTypes` is a bitmask selecting the encoding (e.g. JSON, zlib-compressed JSON, CBOR), so a dapp can look up a contract's interface by ENS name.

## Public key (pubkey)

A SECP256k1 public key as an `(x, y)` pair (`pubkey(node)`). Used by applications that key encryption or signing off an ENS name.

## Interface records (EIP-165)

Discovery of the contract that implements a given [EIP-165](https://eips.ethereum.org/EIPS/eip-165) interface for a name (`interfaceImplementer(node, interfaceID)`). Lets a client find, say, the contract handling a particular standard for `name.eth`.

## DNS records & zonehash

ENS resolvers can also store DNS resource records and a **DNS zonehash** (a pointer to the name's DNSSEC zone). This backs DNS-over-ENS and DNS-imported names, where a DNS name's records are served through an ENS resolver.

## The name record (reverse resolution)

The `name(node)` record holds the name used in **reverse resolution** (address → name). The omnigraph surfaces this as `reverseName` to avoid confusion with the human-readable name. A reverse claim is only trustworthy after **forward-verifying** it (see [resolution.md](resolution.md)) — the `name` record alone is attacker-settable.

## Reading records via the omnigraph

The omnigraph's resolution fields return all of these record types in one query — `addresses`, `texts`, `contenthash`, `abi`, `pubkey`, `interfaces`, `dnszonehash`, and `reverseName` — already resolved through the effective resolver, so you don't read resolver contracts or follow ENSIP-10 yourself.
