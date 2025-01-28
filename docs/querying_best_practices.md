# ENS GraphQL API Querying Best Practices

## Stable Name Identification

When querying the ENS GraphQL API for specific names or sets of names, it's crucial to understand that labels (both known and unknown) should not be treated as immutable identifiers. Here's why:

### Label Mutability

- An "unknown label" (displayed as `[hex string]`) can transition to a "known label" at any time as new label healing information becomes available
- While rare, a "known label" could theoretically transition back to "unknown" (though ENSNode implementations aim to only grow the set of healable labels)
- The text representation of a name may not reliably map to the same node across time (e.g. due to name normalization differences [ENSIP-15: ENS Name Normalization Standard](https://docs.ens.domains/ensip/15))


Therefore, always use the namehash as the stable identifier when querying the API.

### Recommended Query Pattern

To reliably query for specific names, always:

1. Normalize the name according to ENSIP-15
2. Calculate the namehash/ID from the normalized name on the client side 
3. Query using the namehash/ID rather than the name string

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