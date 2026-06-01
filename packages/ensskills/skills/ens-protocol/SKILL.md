---
name: ens-protocol
description: How the ENS protocol works at a conceptual level — names and the nametree, normalization, namehash/labelhash, the registry/resolver/registrar architecture, forward & reverse resolution, primary names, records (addresses/text/contenthash), name ownership (NFTs, the NameWrapper), and ENS across many chains (L2 subnames, DNS-imported names, CCIP-Read). Read this for protocol fundamentals before querying, displaying, or integrating ENS.
---

# ENS Protocol

The **Ethereum Name Service (ENS)** maps human-readable names (`vitalik.eth`) to machine-readable data — addresses on many chains, text records, content hashes, and more. It is a hierarchical naming system, a **superset of DNS** (any DNS name like `example.com` can be an ENS name), and the records a name points to are owned and controlled by that name's owner.

This skill explains how the protocol works so you can reason about ENS questions — and write integrations that are correct the first time. It does **not** cover contract addresses or any specific product.

When writing ENS code, use **enssdk** for the operations that are easy to get wrong — name normalization, namehash/labelhash, name/label handling, and address parsing — instead of hand-rolling them; the relevant `enssdk` helper is named at each step below. To _read_ ENS state, use the **omnigraph** skill (one GraphQL query answers most questions); this skill is the model behind it.

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology).

## The nametree

ENS names are dot-separated **labels** read right-to-left from an unnamed **root**: `vitalik.eth` is the label `vitalik` under the TLD `eth` under the root. Every name is a node in this tree; a name's direct children are its **subdomains** (a.k.a. subnames), e.g. `pay.vitalik.eth`. Owning a name lets you create subdomains under it. `.eth` is the native ENS TLD; most other TLDs are imported from DNS.

Two hashes identify names on-chain (a name's string is never stored directly):

- **labelhash** — `keccak256` of a single label (`enssdk`: `labelhashInterpretedLabel`).
- **namehash** (ENSIP-1) — a recursive hash of the whole name into a 32-byte **node**, the on-chain identifier for that name (`enssdk`: `namehashInterpretedName`). `namehash("vitalik.eth")` walks the tree hashing each label.

Always hash a normalized/Interpreted value, never raw input. Because only hashes are stored, a label string is sometimes **unknown** (you have only its hash). See [references/names-and-hashing.md](references/names-and-hashing.md).

## Normalization (always)

Before hashing, comparing, or displaying a name you must **normalize** it per [ENSIP-15](https://docs.ens.domains/ensip/15). Never `toLowerCase()` a name. Normalization makes `Vitalik.eth` and `vitalik.eth` resolve to the same node and defends against homoglyph spoofing (e.g. a Cyrillic `а` posing as Latin `a`). Two names are "the same" only after both are normalized.

Don't run the algorithm yourself: `enssdk` wraps `@adraffy/ens-normalize`. Validate with `isNormalizedName` / `isNormalizedLabel`, and coerce raw user input into a safe **Interpreted Name** with `asInterpretedName` (or `asInterpretedLabel`) — the branded type the SDK's hashing and query helpers require. See [references/names-and-hashing.md](references/names-and-hashing.md).

## Architecture: registry, resolver, registrar

Three roles, kept separate on purpose:

- **Registry** — the core contract. For each node it records the **owner** and the address of that name's **resolver** (and the subname registry). It holds pointers, not records.
- **Resolver** — the contract a name points to that actually **stores the records** (addresses, text, contenthash). Different names can use different resolvers; resolvers are pluggable.
- **Registrar** — a contract that **owns a name and hands out subnames** under it under some policy. The `.eth` registrar issues second-level `.eth` names as **ERC-721 NFTs** (so they are tradable and expire/renew). The **NameWrapper** can wrap any name into an **ERC-1155 NFT** with permission "fuses." Other registrars (Basenames on Base, Linea names, 3DNS, etc.) issue names on their own chains/systems.

Resolution always _starts_ at the registry to find the right resolver, then reads records from it. See [references/architecture.md](references/architecture.md).

## Records

A name's resolver can store many record types (ENSIP-5 and friends):

- **Address records** — the chain address(es) the name points to. ENS is **multichain**: a name can hold a different address per chain, keyed by a numeric **coinType** (ENSIP-9 / ENSIP-11). Ethereum mainnet is coinType `60`.
- **Text records** — arbitrary key/value strings: `avatar`, `url`, `description`, `com.twitter`, `com.github`, `email`, etc.
- **Contenthash** — a pointer to decentralized content (IPFS/Arweave/Swarm), e.g. for `name.eth` websites.

In code, validate and normalize addresses with `enssdk`'s `toNormalizedAddress` / `isNormalizedAddress` rather than comparing raw strings. See [references/records.md](references/records.md).

## Resolution

- **Forward resolution** — name → records (`vitalik.eth` → its ETH address, avatar, …). This is the common direction.
- **Reverse resolution** — address → a **primary name** (the name the address owner chose to display). An address can claim _any_ name as its reverse record, so a reverse result is **only trustworthy after forward-verifying it**: resolve the claimed name and confirm it points back to the same address. Skipping this is the single most common ENS integration bug.
- **Primary names are multichain** (ENSIP-19): an address can set a primary name per chain, not only on mainnet.

Modern resolution goes through a **Universal Resolver** that also handles **offchain / L2 names** via **CCIP-Read** (EIP-3668) and **wildcard** resolution (ENSIP-10) — this is how subnames living on an L2 or in an offchain database (Basenames, `uni.eth`, `cb.id`, …) resolve seamlessly. You generally don't call registry/resolver contracts by hand. See [references/resolution.md](references/resolution.md).

## ENS spans many chains

ENS is not "just mainnet." Names and subnames live across L1, L2s, and offchain systems, and DNS names are ENS names too. Practical consequences:

- A name's records and its primary name can differ per chain.
- Some names resolve only through CCIP-Read (their data isn't on mainnet at all).
- Reconciling registries, wrappers, resolvers, and chains by hand is exactly what an indexer like ENSNode (and the omnigraph skill) does for you — prefer that over first-principles chain queries.

## ENSv1 and ENSv2

**ENSv2 does not replace ENSv1 — the two coexist onchain at the same time.** Building correctly means reading a _unified_ view of both, not one or the other.

- **ENSv1** (live today): names are a flat mapping of `namehash → state` on Ethereum mainnet (the registry + resolvers described above), with subnames on other chains (Basenames, Lineanames, 3DNS) stitched in.
- **ENSv2** (in progress): names become a **Namegraph** — a graph of `Registry → Domain → Registry → …` rather than a flat table — with much of the system on an L2, native subname delegation, and first-class onchain **Permissions** (roles governing who can do what).

After ENSv2 launches there can be **two** onchain Domains for the same name (one per version); a name lookup starts at the ENSv2 root and returns whichever Domain resolution would use. So a name is **not** a stable identifier — reference a specific entity by its stable `id`, and resolve records via the current Universal Resolver, not ENSv1-only contracts.

The fundamentals in this skill — names, normalization, hashing, the resolver/record model, forward/reverse resolution — hold across both versions. The safest way to stay version-agnostic is to read the unified data through the omnigraph instead of hardcoding ENSv1 assumptions. See [references/ensv1-and-ensv2.md](references/ensv1-and-ensv2.md).

## References

Pull these only when a task needs the depth:

| Topic                                                                               | File                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Names, labels, normalization, namehash/labelhash, unknown labels                    | [references/names-and-hashing.md](references/names-and-hashing.md) |
| Registry / resolver / registrar, NFTs, NameWrapper, subnames, subregistries         | [references/architecture.md](references/architecture.md)           |
| Forward/reverse resolution, primary names, Universal Resolver, CCIP-Read, coinTypes | [references/resolution.md](references/resolution.md)               |
| Address / text / contenthash records, standard keys, avatars                        | [references/records.md](references/records.md)                     |
| ENSv1 vs ENSv2 — coexistence, Namegraph, two-domains, resolving across both         | [references/ensv1-and-ensv2.md](references/ensv1-and-ensv2.md)     |

Terminology: [ENSNode Terminology](https://ensnode.io/docs/reference/terminology) · Specs: [ENSIPs](https://docs.ens.domains/ensips)

## Related skills

- **omnigraph** — query live ENS state (names, addresses, records, primary names, ownership) in one GraphQL request. This protocol model is what its data shapes reflect.
- **enssdk** — the TypeScript SDK over the omnigraph (typed queries, hashing, normalization helpers).
