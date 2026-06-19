---
name: efp-protocol
description: How the Ethereum Follow Protocol (EFP) works and how it surfaces in the ENS Omnigraph — the onchain social graph (lists, list records, tags), primary-list validation, block/mute follower semantics, and the `Query.efp` / `Account.efp` fields for reading follows, followers, and following. Read this before querying or displaying EFP follow data.
---

# Ethereum Follow Protocol (EFP)

**EFP is an onchain social graph for Ethereum accounts** — a decentralized "who follows whom" primitive. It is _not_ a social network: it has no names, profiles, posts, or auth. It is designed to compose with **ENS** (identity — names, avatars, headers) and **SIWE** (auth). When you render EFP data you almost always pair it with ENS, which is why this skill lives beside the other ENS skills and why EFP is exposed _through the ENS Omnigraph_.

This skill explains the EFP data model and the validity rules that govern it, then maps that model onto the Omnigraph fields you query. Read it before touching any `efp` field — the follower/following numbers are _computed_ (validated, filtered), and reading the raw records instead will give you the wrong answer.

## Dependencies

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — EFP composes with ENS; a record's target address is walked into ENS names and primary names via the same Account/resolution model that skill describes.

To _run_ the queries below, load the **`omnigraph`** skill alongside this one (it points back here for EFP shapes when a query touches EFP fields — a conditional dependency, not the reverse) plus a runner — **`enscli`** from a shell or **`enssdk`** from TypeScript.

## The data model

### List — the unit of the graph

An **EFP List** is an **ERC-721 NFT** (minted in the List Registry on Base) that contains a set of follow relationships. Each list has a numeric **`tokenId`**. A list has three roles, which are usually the same address but can be separated for delegation:

- **owner** — holds the NFT; can transfer it.
- **manager** — authorized to add/remove records and edit metadata.
- **user** — the account the list _represents_: "the account that is following the addresses in the list." This is the role that matters for the social graph.

### List Record — one follow

A **List Record** is the atomic follow. The only indexed record type is the **address record (`recordType` 1)**: a 20-byte target address plus zero or more **tags**. Onchain it's `version | type | address` bytes; the Omnigraph exposes both the decoded `recordData` (the address) and the canonical `record` bytes. A record is read as "the list's user follows this address," with the meaning modulated by its tags.

### Tags — semantic follows

Tags are UTF-8 strings on a record. Standard ones:

- **`block`** — the strongest negative tag; never counts as a follow/follower (and apps typically hide the account entirely).
- **`mute`** — one-directional silence; also excluded from follow/follower counts.
- **`top8`** — UI "Top 8" marker.
- **custom** — arbitrary UTF-8 string tags (e.g. `close-friend`). The Omnigraph returns whatever tag bytes are onchain as `[String!]!`; the EFP protocol restricts tags (alphanumerics plus most emoji, normalized to lowercase), but read tags as opaque strings rather than treating a returned tag as invalid for failing that.

The crucial rule: **`block`- and `mute`-tagged records are excluded from following/followers.** A plain follow has no tags (or only non-block/mute tags).

### Storage Location — where records live

A list's NFT lives on Base, but its records can be stored on a different chain. The **List Storage Location** is a `(chainId, ListRecords contract address, slot)` tuple — `slot` is a bytes32 disambiguator letting many lists share one contract. This decouples ownership from data storage and lets lists be multi-chain (Base / OP Mainnet / Ethereum Mainnet).

### Account Metadata & the primary list

**Account Metadata** is an onchain `(address, key) → value` store. The key that matters is **`primary-list`**, whose value is the `tokenId` of the account's designated primary list.

**Primary List validation is two-step — and both steps must pass:**

1. The account's `primary-list` metadata names a `tokenId`.
2. That list's **`user` role must equal the account**.

Only a **validated primary list** counts toward the social graph. An account can own many lists but has at most one validated primary list. If the metadata is unset, or points at a list whose `user` is someone else, the account has **no** validated primary list (and zero following/followers), even though the raw list and its records still exist onchain.

### Follower semantics

These are derived views over validated primary lists, with block/mute filtered out:

- **following(A)** — the address records in **A's validated primary list**, excluding `block`/`mute`. Empty if A has no validated primary list.
- **followers(A)** — every account whose **validated primary list** holds A as a non-`block`/`mute` record.

## In the Omnigraph

EFP is exposed through two entry points. Both return **null when the connected ENSIndexer does not have the `efp` plugin enabled** — treat that like any other unsupported-instance case (see the omnigraph skill's 503/indexing-status notes), not a query error.

### `Account.efp` — an account's EFP presence (the high-level view)

Prefer this for "who does X follow / who follows X" — it applies primary-list validation and block/mute filtering for you.

- `following` / `followers` — `Account` connections, validated + filtered (see above). The edges are full `Account`s, so you can walk straight into their ENS names (`resolve.primaryNames`) or their own `efp`.
- `primaryList: EfpList` — the **validated** primary list, or null if unset/unvalidated.
- `lists` — every list this account is the `user` of (not necessarily validated/primary).
- `metadata(key: "primary-list")` / `metadatas` — raw account-metadata entries.

### `Query.efp` — list-centric queries

- `efp.list(by: { tokenId })` — one list by NFT token id.
- `efp.lists(where: { owner, user, manager })` — find lists by role address.
- `efp.listRecords(where: { recordData, recordType })` — find records. **Filter by `recordData` to answer "which lists follow this address?"** — note this is the _raw_ record set (any list, includes block/mute), not the validated `Account.efp.followers` view.

### Key types

- **`EfpList`** — `tokenId`, `owner`, `user`, `manager`, `nft` (AccountId), `storageLocation` (`chainId`/`address`/`slot`), `records` (raw `EfpListRecord` connection — includes block/mute), `createdAt`/`updatedAt`.
- **`EfpListRecord`** — `recordData` (target Address), `account` (the target as a full `Account`, always resolvable), `tags`, `recordType` (1=address), `record` (canonical Hex bytes), `list`, `contract`, `slot`.
- **`EfpAccountMetadata`** — `key`, `value` (Hex), `address`, `contract`, timestamps.

### Pick the right field — the #1 EFP mistake

`Account.efp.following`/`followers` are **validated and block/mute-filtered**. `EfpList.records` and `efp.listRecords` are the **raw** records (every tag, any list, no primary-list validation). If you want the social-graph answer, use `following`/`followers`; only drop to raw records when you specifically need tags, storage location, or non-primary lists.

## Example queries

Run these with the **omnigraph**/**enscli** skill. They assume an instance with the `efp` plugin enabled.

### Following & followers, with names

```graphql
query EfpFollowGraph($address: Address!) {
  account(by: { address: $address }) {
    efp {
      primaryList {
        tokenId
      }
      following(first: 10) {
        totalCount
        edges {
          node {
            address
            resolve {
              primaryName(by: { chainName: ETHEREUM }) {
                name {
                  beautified
                }
              }
            }
          }
        }
      }
      followers(first: 10) {
        totalCount
        edges {
          node {
            address
          }
        }
      }
    }
  }
}
```

### Who follows this address (raw records, with tags)

```graphql
# Raw record view: includes block/mute and non-primary lists — inspect `tags`.
query EfpWhoFollows($address: Address!) {
  efp {
    listRecords(where: { recordData: $address }, first: 25) {
      totalCount
      edges {
        node {
          tags
          list {
            tokenId
            user
          }
        }
      }
    }
  }
}
```

### A list by token id, with its records and storage location

```graphql
query EfpList($tokenId: TokenId!) {
  efp {
    list(by: { tokenId: $tokenId }) {
      tokenId
      owner
      user
      manager
      storageLocation {
        chainId
        address
        slot
      }
      records(first: 25) {
        totalCount
        edges {
          node {
            recordData
            tags
          }
        }
      }
    }
  }
}
```

## Related skills

- **omnigraph** — the GraphQL API EFP is exposed through; author and run EFP queries there.
- **ens-protocol** — the ENS model EFP composes with (names, addresses, primary names) for turning record addresses into human-readable identities.

Reference: [EFP docs](https://docs.efp.app) · Terminology: [ENSNode Terminology](https://ensnode.io/docs/reference/terminology)
