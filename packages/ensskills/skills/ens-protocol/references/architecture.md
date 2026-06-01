# Architecture: registry, resolver, registrar

Definitions follow the [ENSNode Terminology Reference](https://ensnode.io/docs/reference/terminology).

The protocol separates _who owns a name_, _where its records live_, and _who hands names out_.

## Registry

The core contract. For each **node** it records:

- the **owner** of that name,
- the address of that name's **resolver**, and
- the registry/owner for that name's subnames.

The registry holds **pointers**, not records. Resolution starts here: look up a node to find its resolver.

## Resolver

The contract a name points to that **stores the actual records** — addresses, text, contenthash (see [records.md](records.md)). Resolvers are pluggable: different names can use different resolver implementations, and a name's owner can change which resolver it uses.

## Registrar

A contract that **owns a name and issues subnames** under it under some policy. Examples:

- The **`.eth` registrar** issues second-level `.eth` names (`name.eth`) as **ERC-721 NFTs**, which are tradable and have expiry/renewal.
- The **NameWrapper** can wrap any name into an **ERC-1155 NFT** and attach permission **fuses** that can restrict what the owner (or parent) may do.

## Subnames

Owning any name lets you create **subnames** (subdomains) beneath it (`pay.vitalik.eth` under `vitalik.eth`) and assign them owners and resolvers. This delegation is recursive down the nametree.

## Subregistries and subregistrars (ENSNode terms)

Supplemental state for a set of subnames often lives **outside** the core Registry. ENSNode names these canonically:

- A **Subregistry** is any structure outside the Registry that holds state for a set of subnames — e.g. the `.eth` BaseRegistrar (NFT + expiry for `.eth` names), the NameWrapper (NFTs, fuses, expiry for the whole tree), L2 contracts for `base.eth` / `linea.eth` subnames, or offchain databases for `uni.eth` / `cb.id`. The protocol defines no standard way to discover or query subregistries; an indexer reconciles them.
- A **Subregistrar** is anything that _writes_ to a subregistry (a registrar, an L2 issuance contract, an offchain issuer, even an NFT marketplace trading a name).

The practical upshot: a name's full state can be **spread across the Registry plus one or more subregistries on different chains or offchain**. Reading ENS correctly means combining them — which is what the omnigraph does for you.
