# Architecture: registry, resolver, registrar

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology). The core roles below (Registry, Resolver, Registrar) are the standard ENS roles; **Subregistry**, **Subregistrar**, and **Shadow Registry** are ENSNode's canonical extensions for the multichain/offchain state that modern ENS spreads across many contracts.

The protocol separates three concerns on purpose: _who owns a name_ (Registry), _where its records live_ (Resolver), and _who hands names out_ (Registrar). A name's full state is frequently spread across more than one contract and chain, so reading ENS correctly means combining them.

## Registry

The core contract. For each **node** it records:

- the **owner** of that name,
- the address of that name's **resolver**, and
- the registry/owner for that name's subnames.

The registry holds **pointers**, not records. Resolution starts here: look up a node to find its resolver.

In ENSv1 the registry is effectively a flat `namehash → state` mapping on Ethereum mainnet. In ENSv2 names form a **graph** — `Registry → Domain → Registry → …`, a registry-of-registries — so a registry can natively point to the child registries that manage its subnames. ENSv1 names have no real on-chain subname registry of their own; ENSNode _models_ that relationship rather than reading it from a contract. See [ensv1-and-ensv2.md](ensv1-and-ensv2.md).

## Resolver

The contract a name points to that **stores the actual records** — addresses, text, contenthash (see [records.md](records.md)). Resolvers are pluggable: different names can use different resolver implementations, and a name's owner can change which resolver it uses.

**Assigned vs effective resolver.** The resolver a name has _assigned_ is not necessarily the resolver that actually answers for it. The **effective** resolver is determined by following ENS Forward Resolution and ENSIP-10 (wildcard resolution) up the nametree — a name with no assigned resolver can still resolve via an ancestor. Never read records from a name's assigned resolver in isolation; that operation is **not** ENS Forward Resolution and will silently miss wildcard and offchain names. Resolve through the protocol (or the omnigraph's resolution fields, which do this for you) — see [resolution.md](resolution.md).

## Registrar

A contract that **owns a name and issues subnames** under it under some policy. Examples:

- The **`.eth` registrar** (the BaseRegistrar) issues second-level `.eth` names (`name.eth`) as **ERC-721 NFTs**, which are tradable and have expiry, a grace period, and renewal. Basenames and Lineanames use their own BaseRegistrar deployments.
- The **NameWrapper** can wrap any name into an **ERC-1155 NFT** and attach permission **fuses** that restrict what the owner (or parent) may do.

## Subnames

Owning any name lets you create **subnames** (a.k.a. subdomains) beneath it (`pay.vitalik.eth` under `vitalik.eth`) and assign them owners and resolvers. This delegation is recursive down the nametree.

## Subregistry and Subregistrar (ENSNode canonical terms)

State for a set of subnames frequently lives **outside** the core Registry. ENSNode names this canonically:

- A **Subregistry** is any data structure outside the Registry that manages supplemental state for a set of subnames. A name can be associated with more than one subregistry, so its **full state must be combined across the Registry and each subregistry**. For example, the state of direct subnames of `.eth` is spread across the Registry, the **BaseRegistrar** (ERC-721 NFTs + expiry for `.eth` names), and the **NameWrapper** (ERC-1155 NFTs, fuses, and expiry for the whole tree). The ENS protocol defines no standard for subregistries: they can live on L1, on L2s, or offchain (a database — or even a Google Sheet), and there is no standardized way to discover or query them.
- A **Subregistrar** is any system that is a Registrar _or_ that writes to a subregistry — e.g. the ETHRegistrarController (which writes to the BaseRegistrar), the L2 issuance contracts for `base.eth` / `linea.eth`, the offchain issuers for `uni.eth` / `cb.id`, an NFT marketplace trading a name (each trade mutates subregistry state), or any DNS registrar (ENS is a superset of DNS).
- A **Shadow Registry** is a subregistry implemented as a contract exposing the same interface as the Registry, used as a CCIP-Read source for ENSIP-10 wildcard subnames — e.g. Basenames mirrors a subset of `base.eth` state in an L2 registry contract. This is how an L2's subnames stay resolvable from mainnet (see [resolution.md](resolution.md)).

The practical upshot: a name's full state can be **spread across the Registry plus one or more subregistries on different chains or offchain**. Reading ENS correctly means combining them — which is exactly what an indexer like ENSNode (and the omnigraph) does for you.
