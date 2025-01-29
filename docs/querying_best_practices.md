# ENSNode API Querying Best Practices

## Stable Name Identification

When querying the ENSNode API for specific names or sets of names, it's crucial to understand that the representation of labels (both known and unknown) are not immutable identifiers. Here's why:

### Label Mutability

- When ENSNode indexes an "unknown label" (represented within ENSNode as `[labelhash]`), ENSNode may transition its representation of that label to become a "known label" at any time as its set of healable labels grows.
- The set of healable labels is augmented with offchain data. Therefore, from the perspective of an ENSNode client it is also theoretically possible that a "known label" in an ENSNode instance might transition back to its "unknown" representation. Each ENSNode instance makes efforts to avoid this from happening by aiming to only grow (and never shrink) its set of healable labels across time. However, if an ENSNode instance has its set of healable labels reset (ex: due to some manual database administration action, such as a completely new deployment without reading from a backup) then this case may be experienced by an ENSNode client.
- The [ENSIP-15: ENS Name Normalization Standard](https://docs.ens.domains/ensip/15) may change across time such that the set of normalizable names grows (thankfully it should never shrink). For example, consider a new Unicode release that standardizes new emoji. The ENS Normalize standard may subsequently change to expand support for those new emoji.


Therefore, always use the node of a name (calculated by the namehash of the name) as the stable identifier when querying the ENSNode API. The node of a name is immutable across time.

### Recommended Query Pattern

To reliably query for specific names, always:

1. Normalize the name according to ENSIP-15
2. Calculate the namehash/ID from the normalized name on the client side 
3. Query using the id of the name, rather than the name itself (for backwards compatibility with the ENS Subgraph, the id of the name is actually the node of the name, as calculated by namehash of the name).

Example:

```graphql
{
  domain(id: "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835") {
    id
    name
    labelName
    labelhash
    createdAt
  }
}
```

Result:

```json
{
  "data": {
    "domain": {
      "createdAt": "1497775154",
      "id": "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
      "labelName": "vitalik",
      "labelhash": "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
      "name": "vitalik.eth"
    }
  }
}
```