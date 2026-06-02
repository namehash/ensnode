---
name: omnigraph
description: Query ENS data (names, addresses, records, primary names, ownership, registrations, subnames, resolvers) via the ENS Omnigraph — a single GraphQL API that unifies ENSv1 and ENSv2 across all chains. Use whenever a task needs to read ENS state, instead of querying chains/the subgraph from first principles.
---

# ENS Omnigraph

The **Omnigraph** is a single GraphQL API (Relay spec) over an ENSNode index that answers almost any ENS question in one well-crafted query. It presents a **unified ENSv1 + ENSv2 datamodel across every chain** (mainnet, Basenames, Lineanames, 3DNS, …), so you do not have to reconcile registries, wrappers, resolvers, or chains yourself — the server does the wrangling.

**Reach for the Omnigraph instead of** querying contracts/RPC directly, the legacy ENS Subgraph, or stitching together multiple calls. One query typically replaces a whole pipeline.

New to how ENS works? The **ens-protocol** skill explains the protocol this API models — names and the nametree, normalization, resolution, registries/resolvers/registrars, and records. Read it first if the data shapes below don't yet make sense.

## How to run a query

Use the `enscli` CLI (no install step beyond `npx`). It prints JSON when piped (ideal for parsing) and exits non-zero on error.

```bash
# A raw query (the string is the exact GraphQL payload — zero translation)
npx enscli ensnode omnigraph '{ domain(by: { name: "vitalik.eth" }) { canonical { name { interpreted } } owner { address } } }'

# With variables
npx enscli ensnode omnigraph 'query D($n: InterpretedName!){ domain(by:{name:$n}){ owner { address } } }' --variables '{"n":"nick.eth"}'

# Pick a namespace (default: mainnet). Hosted: mainnet, sepolia, sepolia-v2.
npx enscli ensnode omnigraph '{ ... }' --namespace sepolia

# Point at a specific instance instead of a hosted default
npx enscli ensnode omnigraph '{ ... }' --ensnode-url http://localhost:4334
```

You can also POST `{ "query": "...", "variables": {...} }` to `/api/omnigraph` on any ENSNode instance — but prefer `enscli`, which handles namespaces, URLs, and JSON output for you. The **enscli** skill is the full CLI reference (output contract, namespace/URL resolution, every command).

## Discover the schema (no network)

The schema ships with the CLI. Explore it before writing a query — never guess field names.

```bash
npx enscli ensnode omnigraph schema                 # root query fields + the major types
npx enscli ensnode omnigraph schema Domain          # a type's fields, with descriptions
npx enscli ensnode omnigraph schema Domain.canonical # a single field
npx enscli ensnode omnigraph schema --search primary # find types/fields by keyword
```

A condensed reference is also inlined below.

## Core concepts

- **Domain** — a node in the ENS nametree. `domain(by: { name })` or `domain(by: { id })`. `canonical` carries the name/path/node when the Domain is reachable by forward resolution (null otherwise). `owner`, `subdomains`, `registration`, `resolver`, and `events` hang off it.
- **Account** — an address. `account(by: { address })` exposes `domains`, `permissions`, and resolution (`resolve`).
- **Resolution lives in the graph.** Don't resolve separately — select it inline:
  - `Domain.resolve { records { addresses(coinTypes: [60]) { address } texts(keys: ["avatar"]) { value } } }` — forward resolution (records) for a name.
  - `Account.resolve { primaryNames(where: { chainNames: [ETHEREUM, BASE] }) { name { interpreted } } }` — reverse resolution (primary names) for an address.
- **Registration** is a union: `BaseRegistrarRegistration` (.eth, Basenames, Lineanames), `NameWrapperRegistration`, etc. Use inline fragments (`... on BaseRegistrarRegistration { ... }`).
- **Relay pagination** — connections expose `edges { node }`, `pageInfo { hasNextPage endCursor }`, and `totalCount`. Paginate with `first` + `after: <endCursor>`. (No offset pagination.)
- **Field selection is the budget.** GraphQL returns exactly the fields you select — request only what you need to keep responses (and your context) small.

## When the Omnigraph can't express it

If a question genuinely isn't expressible in the Omnigraph schema, the underlying ENS state is also queryable via Unigraph SQL over ENSDb (the `unigraph-sql` skill). Prefer the Omnigraph first; escalate to SQL only for shapes the GraphQL surface doesn't support.

## Schema reference

<!-- AUTOGEN:SCHEMA start -->

### Query (entry points)

- account(by: AccountByInput!): Account — Identify an Account by ID or Address.
- domain(by: DomainIdInput!): Domain — Identify a Domain by Name or DomainId
- domains(after: String, before: String, first: Int, last: Int, order: DomainsOrderInput, where: DomainsWhereInput!): QueryDomainsConnection — Find Canonical Domains by Name.
- permissions(by: PermissionsIdInput!): Permissions — Identify Permissions by ID or AccountId.
- registry(by: RegistryIdInput!): Registry — Identify a Registry by ID or AccountId. If querying by `contract`, only concrete Registries will be returned.
- resolver(by: ResolverIdInput!): Resolver — Identify a Resolver by ID or AccountId.
- root: Registry! — The Root Registry for this namespace. It will be the ENSv2 Root Registry when defined, otherwise the ENSv1 Root Registry.

### Core types

#### Domain

_Represents a Domain, i.e. an individual Label within the ENS namegraph. It may or may not be Canonical. It may be an ENSv1Domain or an ENSv2Domain._

- canonical: DomainCanonical — Metadata (name, path, and node) related to the Domain's canonicality, if known. Null when the Domain is not in the canonical nametree.
- events(after: String, before: String, first: Int, last: Int, where: EventsWhereInput): DomainEventsConnection — All Events associated with this Domain.
- id: DomainId! — A unique and stable reference to this Domain.
- label: Label! — The Label associated with this Domain in the ENS Namegraph.
- owner: Account — If this is an ENSv1Domain, this is the effective owner of the Domain. If this is an ENSv2Domain, this is the on-chain owner address (the HCA account address if used).
- parent: Domain — The Domain that this Domain's parent Registry declares as its Canonical Domain, if any. Follows a single unidirectional pointer (`Registry.canonicalDomainId`) and does NOT enforce bidirectional canonical-edge agreement: a non-canonical Domain may have a non-null `parent`, and a canonical Domain's `parent` may itself be non-canonical. Null when the parent Registry does not declare a Canonical Domain.
- registration: Registration — The latest Registration for this Domain, if exists.
- registrations(after: String, before: String, first: Int, last: Int): DomainRegistrationsConnection — All Registrations for a Domain, including the latest Registration.
- registry: Registry! — The Registry under which this Domain exists.
- resolve(accelerate: Boolean): ForwardResolve! — Resolve protocol-level data for this Domain.
- resolver: DomainResolver! — Resolver relationship metadata for this Domain.
- subdomains(after: String, before: String, first: Int, last: Int, order: DomainsOrderInput, where: SubdomainsWhereInput): DomainSubdomainsConnection — All Domains that are direct descendents of this Domain in the namegraph.
- subregistry: Registry — The Registry this Domain declares as its Subregistry, if exists.

#### DomainCanonical

_Canonicality metadata for a Domain, including its name, depth, path, and node (namehash)._

- depth: Int! — The depth of this Domain, i.e. the number of labels in this Domain's Canonical Name (e.g. 2 for `vitalik.eth`).
- name: CanonicalName! — The Canonical Name for this Domain.
- node: Node! — The namehash of this Domain's Canonical Name. Note that this is NOT a stable reference to this Domain; use `Domain.id`.
- path: [Domain!]! — The Canonical Path from this Domain to the ENS Root, root→leaf inclusive of this Domain.

#### Account

_Represents an individual Account, keyed by its Address._

- address: Address! — An EVM Address that uniquely identifies this Account on-chain.
- domains(after: String, before: String, first: Int, last: Int, order: DomainsOrderInput, where: AccountDomainsWhereInput): AccountDomainsConnection — The Domains that are owned by the Account.
- events(after: String, before: String, first: Int, last: Int, where: AccountEventsWhereInput): AccountEventsConnection — All Events for which this Account is the HCA-aware `sender` (i.e. `Event.sender`).
- id: Address! — A unique reference to this Account.
- permissions(after: String, before: String, first: Int, last: Int, where: AccountPermissionsWhereInput): AccountPermissionsConnection — The Permissions granted to this Account, optionally filtered to Permissions in a specific contract.
- registryPermissions(after: String, before: String, first: Int, last: Int): AccountRegistryPermissionsConnection — The Permissions on Registries granted to this Account.
- resolve(accelerate: Boolean): ReverseResolve! — Resolve primary names for this Account.
- resolverPermissions(after: String, before: String, first: Int, last: Int): AccountResolverPermissionsConnection — The Permissions on Resolvers granted to this Account.

#### Resolver

_A Resolver represents a Resolver contract on-chain._

- bridged: Registry — If Resolver is a Bridged Resolver, the Registry to which it Bridges resolution.
- contract: AccountId! — Contract metadata for this Resolver.
- events(after: String, before: String, first: Int, last: Int, where: EventsWhereInput): ResolverEventsConnection — All Events associated with this Resolver.
- id: ResolverId! — A unique reference to this Resolver.
- permissions: Permissions — Permissions granted by this Resolver.
- records(after: String, before: String, first: Int, last: Int): ResolverRecordsConnection — ResolverRecords issued by this Resolver.
- records\_(by: NameOrNodeInput!): ResolverRecords — Identify a ResolverRecord by `name` or `node`.

#### DomainResolver

_Metadata describing this Domain's relationship to its Resolver(s)._

- assigned: Resolver — The Resolver that this Domain has assigned, if any. NOTE that this is the Domain's _assigned_ Resolver, _not_ its _effective_ Resolver, which can only be determined by following ENS Forward Resolution and ENSIP-10. Do NOT use this Domain-Resolver relationship in isolation to resolve records, that operation is NOT ENS Forward Resolution.

#### Registry

_A Registry represents a Registry contract in the ENS namegraph. It may be an ENSv1Registry (a concrete ENSv1 Registry contract), an ENSv1VirtualRegistry (the virtual Registry managed by an ENSv1 domain that has children), or an ENSv2Registry._

- canonical: Boolean! — Whether the Registry is Canonical.
- contract: AccountId! — Contract metadata for this Registry. If this is an ENSv1VirtualRegistry, this will reference the concrete Registry contract under which the parent Domain exists.
- domains(after: String, before: String, first: Int, last: Int, order: DomainsOrderInput, where: RegistryDomainsWhereInput): RegistryDomainsConnection — The Domains managed by this Registry.
- id: RegistryId! — A unique reference to this Registry.
- parents(after: String, before: String, first: Int, last: Int): RegistryParentsConnection — The Domains for which this Registry is a Subregistry.
- permissions: Permissions — The Permissions managed by this Registry.

#### Permissions

_Permissions_

- contract: AccountId! — The contract within which these Permissions are granted.
- events(after: String, before: String, first: Int, last: Int, where: EventsWhereInput): PermissionsEventsConnection — All Events associated with these Permissions.
- id: PermissionsId! — A unique reference to this Permission.
- resources(after: String, before: String, first: Int, last: Int): PermissionsResourcesConnection — All PermissionResources managed by this contract.
- root: PermissionsResource! — The Root Resource.

#### ReverseResolve

_Nested account resolution container exposing primary name resolution._

- acceleration: AccelerationStatus! — Whether protocol acceleration was requested and attempted for this reverse resolution.
- primaryName(by: PrimaryNameByInput!): PrimaryNameRecord! — The primary name for this Account on a specific coin type or chain name.
- primaryNames(where: PrimaryNamesWhereInput!): [PrimaryNameRecord!]! — Primary names for this Account on the requested coin types or chain names.
- trace: JSON! — Protocol trace tree emitted by reverse resolution, represented as JSON for schema stability. This data model should be expected to experience breaking changes.

#### ForwardResolve

_Nested domain resolution container exposing resolved data for the domain._

- acceleration: AccelerationStatus! — Whether protocol acceleration was requested and attempted for this resolution.
- records: ResolvedRecords — Resolved ENS records via the ENS protocol. Null when the name is not resolvable (non-canonical, unnormalized, or no records field was selected).
- trace: JSON — Protocol trace tree emitted by resolution, represented as untyped JSON for schema stability. This data model should be expected to experience breaking changes.

#### ResolvedRecords

_Records resolved for a specific ENS name via the ENS protocol._

- abi(contentTypeMask: BigInt!): ResolvedAbiRecord — The first stored ABI matching the requested content-type bitmask, or null if not set.
- addresses(coinTypes: [CoinType!]!): [ResolvedAddressRecord!]! — Resolved address records for the requested coin types.
- contenthash: Hex — The ENSIP-7 contenthash record raw bytes, or null if not set.
- dnszonehash: Hex — The IDNSZoneResolver zonehash raw bytes, or null if not set.
- interfaces(ids: [InterfaceId!]!): [ResolvedInterfaceRecord!]! — Resolved ERC-165 interface implementer records for the requested ids.
- pubkey: ResolvedPubkeyRecord — The PubkeyResolver (x, y) pair, or null if not set.
- reverseName: String — The `name` record value used in Reverse Resolution (ENSIP-19), or null if not set. To reduce a common point of developer confusion the Omnigraph API represents this as the `reverseName` rather than the `name` record which is what this field actually resolves to onchain.
- texts(keys: [String!]!): [ResolvedRawTextRecord!]! — Resolved text records for the requested keys.
- version: BigInt — The IVersionableResolver version, or null if not set or unavailable.

#### PrimaryNameRecord

_An ENSIP-19 primary name for an Account on a specific coin type._

- chainName: ChainName — The chain corresponding to `coinType`, or null when `coinType` is not represented in `ChainName`.
- coinType: CoinType! — The canonical ENSIP-9 coin type for this primary name lookup.
- name: CanonicalName — The validated primary name for this Account on this coin type, or null if none is set.
- resolve: ForwardResolve! — Forward resolve data for this primary name.

### Other types

Run `npx enscli ensnode omnigraph schema <Type>` for fields of:

`AccelerationStatus`, `AccountId`, `BaseRegistrarRegistration`, `CanonicalName`, `DomainProfile`, `ENSv1Domain`, `ENSv1Registry`, `ENSv1VirtualRegistry`, `ENSv2Domain`, `ENSv2Registry`, `ENSv2RegistryRegistration`, `ENSv2RegistryReservation`, `Event`, `Label`, `NameWrapperRegistration`, `PageInfo`, `PermissionsResource`, `PermissionsUser`, `ProfileAddresses`, `ProfileAvatar`, `ProfileBanner`, `ProfileSocialAccount`, `ProfileSocials`, `ProfileWebsite`, `RegistryPermissionsUser`, `Renewal`, `ResolvedAbiRecord`, `ResolvedAddressRecord`, `ResolvedInterfaceRecord`, `ResolvedPubkeyRecord`, `ResolvedRawTextRecord`, `ResolverPermissionsUser`, `ResolverRecords`, `ThreeDNSRegistration`, `WrappedBaseRegistrarRegistration`

<!-- AUTOGEN:SCHEMA end -->

## Example queries

These are vetted, copy-pasteable patterns. Adapt the selection set to your needs.

<!-- AUTOGEN:EXAMPLES start -->

### find-domains

```graphql
query FindDomains($name: DomainsNameFilter!, $order: DomainsOrderInput) {
  domains(where: { name: $name }, order: $order, first: 20) {
    edges {
      node {
        __typename
        id
        label {
          interpreted
          hash
        }
        canonical {
          name {
            interpreted
            beautified
          }
        }

        registration {
          expiry
          event {
            timestamp
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "name": {
    "starts_with": "vitalik"
  },
  "order": {
    "by": "NAME",
    "dir": "DESC"
  }
}
```

### domain-by-name

```graphql
query DomainByName($name: InterpretedName!) {
  domain(by: { name: $name }) {
    __typename
    id
    label {
      interpreted
      hash
    }
    canonical {
      name {
        interpreted
      }
      node
      path {
        id
      }
    }
    owner {
      address
    }
    subregistry {
      contract {
        chainId
        address
      }
    }

    ... on ENSv1Domain {
      rootRegistryOwner {
        address
      }
    }
  }
}
```

Variables:

```json
{
  "name": "eth"
}
```

### domain-registration

```graphql
query DomainRegistration($name: InterpretedName!) {
  domain(by: { name: $name }) {
    canonical {
      name {
        interpreted
      }
    }

    registration {
      __typename
      id
      start
      expiry
      expired
      referrer
      registrar {
        chainId
        address
      }
      registrant {
        address
      }
      renewals(first: 5) {
        totalCount
        edges {
          node {
            duration
            base
            premium
            referrer
          }
        }
      }

      # ENSv1 .eth registrations (also Basenames & Lineanames)
      ... on BaseRegistrarRegistration {
        baseCost
        premium
        isInGracePeriod
        # present when the .eth name is wrapped by the NameWrapper
        wrapped {
          fuses
          tokenId
        }
      }

      # names held natively in the NameWrapper
      ... on NameWrapperRegistration {
        fuses
      }
    }
  }
}
```

Variables:

```json
{
  "name": "vitalik.eth"
}
```

### domain-records

```graphql
query DomainRecords($name: InterpretedName!) {
  domain(by: { name: $name }) {
    canonical {
      name {
        interpreted
      }
    }
    resolve {
      records {
        addresses(coinTypes: [60]) {
          coinType
          address
        }
        texts(keys: ["description"]) {
          key
          value
        }
      }
    }
  }
}
```

Variables:

```json
{
  "name": "vitalik.eth"
}
```

### domain-subdomains

```graphql
query DomainSubdomains($name: InterpretedName!) {
  domain(by: { name: $name }) {
    canonical {
      name {
        interpreted
        beautified
      }
    }
    subdomains(first: 10) {
      edges {
        node {
          canonical {
            name {
              interpreted
              beautified
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "name": "eth"
}
```

### subdomains-pagination

```graphql
query SubdomainsPagination($first: Int!, $after: String) {
  domain(by: { name: "eth" }) {
    canonical {
      name {
        interpreted
      }
    }

    # paginate child names: pass pageInfo.endCursor back as $after for the next page
    subdomains(first: $first, after: $after) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          canonical {
            name {
              interpreted
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "first": 10,
  "after": null
}
```

### domain-events

```graphql
query DomainEvents($name: InterpretedName!) {
  domain(by: { name: $name }) {
    events {
      totalCount
      edges {
        node {
          from
          to
          topics
          data
          timestamp
          transactionHash
        }
      }
    }
  }
}
```

Variables:

```json
{
  "name": "newowner.eth"
}
```

### domains-by-address

```graphql
query AccountDomains($address: Address!) {
  account(by: { address: $address }) {
    domains {
      edges {
        node {
          label {
            interpreted
          }
          canonical {
            name {
              interpreted
              beautified
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
}
```

### account-primary-names

```graphql
query AccountPrimaryNames($address: Address!) {
  account(by: { address: $address }) {
    address
    resolve {
      primaryNames(where: { chainNames: [ETHEREUM, BASE] }) {
        coinType
        chainName
        name {
          interpreted
          beautified
        }
        resolve {
          records {
            addresses(coinTypes: [60]) {
              coinType
              address
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
}
```

### account-events

```graphql
query AccountEvents($address: Address!) {
  account(by: { address: $address }) {
    events {
      totalCount
      edges {
        node {
          topics
          data
          timestamp
        }
      }
    }
  }
}
```

Variables:

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
}
```

### registry-domains

```graphql
query RegistryDomains($registry: AccountIdInput!) {
  registry(by: { contract: $registry }) {
    domains {
      edges {
        node {
          label {
            interpreted
          }
          canonical {
            name {
              interpreted
              beautified
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "registry": {
    "chainId": 31337,
    "address": "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf"
  }
}
```

### permissions-by-contract

```graphql
query PermissionsByContract($contract: AccountIdInput!) {
  permissions(by: { contract: $contract }) {
    resources {
      edges {
        node {
          resource
          users {
            edges {
              node {
                id
                user {
                  address
                }
                roles
              }
            }
          }
        }
      }
    }
    events {
      totalCount
      edges {
        node {
          topics
          data
          timestamp
        }
      }
    }
  }
}
```

Variables:

```json
{
  "contract": {
    "chainId": 31337,
    "address": "0x21df544947ba3e8b3c32561399e88b52dc8b2823"
  }
}
```

### permissions-by-user

```graphql
query PermissionsByUser($address: Address!) {
  account(by: { address: $address }) {
    permissions {
      edges {
        node {
          resource
          roles
        }
      }
    }
  }
}
```

Variables:

```json
{
  "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
}
```

### account-resolver-permissions

```graphql
query AccountResolverPermissions($address: Address!) {
  account(by: { address: $address }) {
    resolverPermissions {
      edges {
        node {
          resolver {
            contract {
              address
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
}
```

### domain-resolver

```graphql
query DomainResolver($name: InterpretedName!) {
  domain(by: { name: $name }) {
    resolver {
      assigned {
        records {
          edges {
            node {
              node
              keys
              coinTypes
            }
          }
        }
        permissions {
          resources {
            edges {
              node {
                resource
                users {
                  edges {
                    node {
                      user {
                        address
                      }
                      roles
                    }
                  }
                }
              }
            }
          }
        }
        events {
          totalCount
          edges {
            node {
              topics
              data
              timestamp
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{
  "name": "vitalik.eth"
}
```

### resolver-by-address

```graphql
query ResolverByAddress($contract: AccountIdInput!) {
  resolver(by: { contract: $contract }) {
    id
    contract {
      chainId
      address
    }

    # records this resolver stores, keyed by node
    records(first: 5) {
      totalCount
      edges {
        node {
          node
          name
          keys
          coinTypes
        }
      }
    }

    events {
      totalCount
      edges {
        node {
          topics
          data
          timestamp
        }
      }
    }
  }
}
```

Variables:

```json
{
  "contract": {
    "chainId": 1,
    "address": "0xf29100983e058b709f3d539b0c765937b804ac15"
  }
}
```

### namegraph

```graphql
query Namegraph {
  root {
    id
    domains {
      edges {
        node {
          canonical {
            name {
              interpreted
              beautified
            }
          }

          subdomains {
            edges {
              node {
                canonical {
                  name {
                    interpreted
                    beautified
                  }
                }

                subdomains {
                  edges {
                    node {
                      canonical {
                        name {
                          interpreted
                          beautified
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Variables:

```json
{}
```

### account-migrated-names

```graphql
query AccountMigratedNames($address: Address!) {
  account(by: { address: $address }) {
    v1DomainsCount: domains(where: { version: ENSv1 }) {
      totalCount
    }
    v2DomainsCount: domains(where: { version: ENSv2 }) {
      totalCount
    }
  }
}
```

Variables:

```json
{
  "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
}
```

### eth-by-version

```graphql
query GetEthDomains {
  domains(where: { name: { eq: "eth" } }) {
    edges {
      node {
        __typename
        id
      }
    }
  }
}
```

Variables:

```json
{}
```

<!-- AUTOGEN:EXAMPLES end -->
