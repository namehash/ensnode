# Resolution: forward, reverse, primary names

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology).

## Forward resolution (name → records)

Given a name, find its records (address, avatar, …). The flow: namehash the (normalized) name → ask the Registry for that node's resolver → read records from the resolver.

A **Resolvable Name** is one that forward resolution accepts: only literal label segments, each label ≤ 255 bytes. A name containing an **Encoded LabelHash** (an unknown label) can be traversed in the nametree but is **not** resolvable — its records cannot be fetched.

## Reverse resolution (address → name) and primary names

An address can publish a **primary name** — the name it wants shown — via a reverse record under the `addr.reverse` namespace. Reverse resolution reads that record.

**Critical:** anyone can set their reverse record to _any_ name. A reverse result is trustworthy only after **forward-verification**: resolve the claimed name and confirm it points back to the same address. Display the primary name only if it round-trips. Skipping this is the most common ENS bug.

Primary names are **multichain** ([ENSIP-19](https://docs.ens.domains/ensip/19)): an address can set a different primary name per chain, not just on Ethereum mainnet.

## Universal Resolver, CCIP-Read, wildcards

You normally do **not** call the Registry and resolver contracts directly. A **Universal Resolver** performs the registry lookup, resolver call, and reverse-with-verification in one entry point, and it transparently handles names whose data lives offchain or on an L2:

- **CCIP-Read** ([EIP-3668](https://eips.ethereum.org/EIPS/eip-3668)) — a resolver can defer to an offchain gateway, which returns signed data verified on-chain. This is how offchain/L2 subnames resolve seamlessly.
- **Wildcard resolution** ([ENSIP-10](https://docs.ens.domains/ensip/10)) — a parent's resolver can answer for subnames that have no record of their own, enabling subnames issued in bulk (often via CCIP-Read).

Because of CCIP-Read, some names' data **isn't on mainnet at all** — querying mainnet contracts directly will miss them. Use a resolver-aware client or an indexer.

## Multichain addresses (coinTypes)

Address records are keyed by a numeric **coinType**:

- [ENSIP-9](https://docs.ens.domains/ensip/9) maps SLIP-44 coin types (e.g. `60` = Ethereum mainnet, `0` = Bitcoin).
- [ENSIP-11](https://docs.ens.domains/ensip/11) encodes EVM chains so a name can carry a distinct address per L2.

So "the address for `alice.eth`" is incomplete — it's the address _for a given chain_.
