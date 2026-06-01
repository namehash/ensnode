# ENSv1 and ENSv2

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology).

ENSv2 does not replace ENSv1 — both are live onchain at once, with substantially different data models, so an integration must read a **unified** view of both. This page details how they differ and what that means for your code.

## ENSv1 (live today)

- A name maps to state via a flat **`namehash → state`** table (a Nametable): the Registry stores each node's owner and resolver, resolvers store records.
- It lives on **Ethereum mainnet**, but a name's full state is often spread across **subregistries** on other systems — `.eth` (BaseRegistrar + NameWrapper), Basenames on Base, Lineanames on Linea, 3DNS on Optimism, offchain issuers like `uni.eth` / `cb.id`. See [architecture.md](architecture.md).
- There is no protocol-level way to discover or query those subregistries; reconciling them is exactly what an indexer does.

## ENSv2 (in progress)

- A name is a node in a **Namegraph** — a graph of `Registry → Domain → Registry → Domain → …` rather than a flat table. The graph can be cyclic, and many _disjoint_ Namegraphs exist (one per root: ENSv1 root, ENSv2 root, Basenames, etc.).
- Much of the system moves onto an **L2**, with a **registry-of-registries** structure and **native subname delegation** (any Registry can point a name at a child Registry).
- **Permissions are first-class onchain**: contracts like the Registry and resolvers carry role bitmaps governing who may do what on a resource — readable as structured data, not inferred.

The ENSNode `unigraph` plugin builds **one** unified model (the **Unigraph**) over all of this: two Namegraphs (ENSv1 root and ENSv2 root) plus the multichain subregistries, stitched together using ENS resolution semantics. Navigating from `eth` → `vitalik.eth` → below looks identical regardless of whether the underlying entity is ENSv1 or ENSv2, on mainnet or an L2.

## The "two domains" consequence

After ENSv2 launches, the same name can have **two** onchain Domains — one in the ENSv1 Namegraph and one in the ENSv2 Namegraph. A lookup **by name** starts at the **ENSv2 root** and returns whichever Domain forward resolution would use; once a `.eth` name is reserved on the ENSv2 side, that ENSv2 Domain is the "real" one (and, before per-name migration, its resolver forwards resolution back to the ENSv1 Namegraph).

Practical rules for writing integrations:

- **A name is not a stable identifier.** Re-parenting/re-aliasing means a name can point at a different Domain over time. Reference a specific onchain entity by its stable **`id`**; look up **by name** only when you want "whatever this resolves to right now." (In the omnigraph: `domain(by: { id })` vs `domain(by: { name })`.)
- **Resolve through the current Universal Resolver**, not ENSv1-only contracts — using the old path risks stale/incorrect results once ENSv2 is live. In practice this is handled for you by an up-to-date resolution stack or by reading resolved records through the omnigraph (which internally implements accelerated, standards-correct resolution including CCIP-Read).
- **Don't bake in ENSv1-only assumptions** (e.g. "a name is one object", "all state is on mainnet"). Query the unified data and select per-version fields only when you need them.

## Version-specific fields (omnigraph)

In the omnigraph, `Domain`, `Registry`, and `Registration` are interfaces with concrete ENSv1/ENSv2 implementations (`ENSv1Domain` / `ENSv2Domain`, etc.). Shared fields work unconditionally; reach version-specific fields via inline fragments, and filter a query to one version with `version: ENSv1` / `version: ENSv2` where supported. The **omnigraph** and **enssdk** skills cover the query shapes.

## Learn more (ENS team)

- [ENSv2 overview](https://ens.domains/ensv2)
- [ENSv2 architecture](https://ens.domains/blog/post/ensv2-architecture)
- [Names are no longer single objects](https://ens.domains/blog/post/names-are-no-longer-single-objects)
- [ENSv2 contracts](https://docs.ens.domains/contracts/ensv2/overview/)

ENSv2 specifics are still evolving; treat exact contract/field details as moving and confirm against the docs above. The protocol fundamentals in this skill hold across both versions.
