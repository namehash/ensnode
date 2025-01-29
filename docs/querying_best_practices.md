# ENSNode API Querying Best Practices

## Stable Name Identification

When querying the ENSNode API for specific names or sets of names, it's crucial to understand that the representation of labels (both known and unknown) are not immutable identifiers. Here's why:

### Label Mutability

- When ENSNode indexes an "unknown label" (represented within ENSNode as `[labelhash]`), ENSNode may transition its representation of that label to become a "known label" at any time as its set of healable labels grows.
- The set of healable labels is augmented with offchain data. Therefore, from the perspective of an ENSNode client it is also theoretically possible that a "known label" in an ENSNode instance might transition back to its "unknown" representation. Each ENSNode instance makes efforts to avoid this from happening by aiming to only grow (and never shrink) its set of healable labels across time. However, if an ENSNode instance has its set of healable labels reset (ex: due to some manual database administration action, such as a completely new deployment without reading from a backup) then this case may be experienced by an ENSNode client.
- The [ENSIP-15: ENS Name Normalization Standard](https://docs.ens.domains/ensip/15) may change across time such that the set of normalizable names grows (thankfully it should never shrink). For example, consider a new Unicode release that standardizes new emoji. The ENS Normalize standard may subsequently change to expand support for those new emoji.


Therefore, always use the node of a name (calculated by the namehash of the name) as the stable identifier when querying the ENSNode API. The node of a name is immutable across time.

### Recommended Query Patterns

There are two distinct patterns for querying names, depending on the source of the name:

#### Pattern 1: Names from User Input

When querying for names that originate from user input (e.g., search fields, user-entered addresses), always:

1. Normalize the name according to ENSIP-15
2. Calculate the namehash/ID from the normalized name on the client side 
3. Query using the id of the name, rather than the name itself (for backwards compatibility with the ENS Subgraph, the id of the name is actually the node of the name, as calculated by namehash of the name).

Example:

First, let's prepare the name for querying by normalizing it and calculating its namehash:

```typescript
import { normalize } from '@ensdomains/ensjs/utils'
import { namehash } from 'viem/ens'

// 1. Normalize the user input according to ENSIP-15
const userInput = 'vitalik.eth'
const normalizedName = normalize(userInput)

// 2. Calculate the namehash/ID from the normalized name
const nameId = namehash(normalizedName)
```

Now we can use this ID to query the ENSNode API:

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

The query will return the domain information:

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

Here's a complete example showing how to put it all together using a GraphQL client:

```typescript
import { normalize } from '@ensdomains/ensjs/utils'
import { namehash } from 'viem/ens'
import { createClient } from 'graphql-request'

async function queryENSName(userInput: string) {
  // 1. Normalize the user input
  const normalizedName = normalize(userInput)
  
  // 2. Calculate the namehash/ID
  const nameId = namehash(normalizedName)
  
  // 3. Set up the GraphQL client
  const client = createClient({
    url: 'YOUR_ENSNODE_ENDPOINT'
  })
  
  // 4. Define the query
  const query = `
    query GetDomain($id: ID!) {
      domain(id: $id) {
        id
        name
        labelName
        labelhash
        createdAt
      }
    }
  `
  
  // 5. Execute the query
  const result = await client.request(query, { id: nameId })
  return result
}
```

#### Pattern 2: Names from Onchain Data

When querying for names that originate from onchain data (e.g., ENS NFTs, contract events), you must:

1. Skip any normalization step - the name must be used exactly as it appears onchain
2. Calculate the namehash/ID directly from the onchain name
3. Query using the id of the name

This pattern is crucial when dealing with unnormalized names that exist onchain. For example, if someone has registered "EXAMPLE.eth" (note the uppercase), attempting to normalize this name would result in looking up a different name than what exists onchain.

The query structure remains the same as Pattern 1, but the input name and resulting ID will reflect the exact onchain data rather than a normalized version.

## Unnormalized Labels

ENSNode may return unnormalized labels associated with indexed names. It is important to note that **ENSNode clients should never attempt to normalize labels returned by ENSNode**. This is because when ENSNode returns an unnormalized label, that label is associated with a specific node that has been indexed. Normalizing an unnormalized label in this context would represent a different node.

There are effectively two distinct query patterns to consider:
1. User input → onchain data: Normalization is appropriate and necessary
2. Onchain data → output: Normalization should NOT be performed

An ENSNode client is permitted to validate that all labels returned by ENSNode are in normalized form, and to reject any names with unnormalized labels from further processing. However, the key principle is that an ENSNode client should never normalize returned labels, as normalization transforms the label and therefore also the node associated with the name the label is contained within.

## Calculating the Node for Unknown Names

According to [ENSIP-1](https://docs.ens.domains/ensip/1#namehash-algorithm), the namehash algorithm makes no special consideration of unknown labels, and therefore interprets unknown labels literally. Due to this behavior, we strongly recommend using an "unknown label aware" namehash algorithm implementation.

A good example of such an implementation can be found in the viem library's namehash implementation:
[viem namehash implementation](https://github.com/wevm/viem/blob/fe558fdef7e2e9cd5f3f57d8bdeae0c7ff67a1b0/src/utils/ens/namehash.ts#L36-L51)

## Unindexable Labels

ENSNode may sometimes represent a label as an unknown label if that label is "unindexable". This is an important consideration when working with the ENSNode API.

While many characters are not supported by ENSIP-15, only the following four characters are specifically classified as "unindexable" due to indexing concerns:

1. `\0` (null byte) - PostgreSQL does not allow storing this character in text fields
2. `.` (period) - Conflicts with ENS label separator logic
3. `[` (left square bracket) - Conflicts with "unknown label" representations
4. `]` (right square bracket) - Conflicts with "unknown label" representations

It's important to note that while onchain ENS contracts do not enforce ENSIP-15 normalization (due to factors like gas costs), these specific characters require special handling by indexers to avoid conflicts.

### Unknown Label Representation

When an unindexable label is encountered, ENSNode represents it as an "unknown label" in the format `[{labelhash}]`, where `{labelhash}` is the labelhash of the unknown label. This representation creates an interesting edge case that must be handled carefully:

Consider an unnormalized label that literally looks like `[24695ee963d29f0f52edfdea1e830d2fcfc9052d5ba70b194bddd0afbbc89765]`. Because this label contains square brackets (unindexable characters), it will be represented as an unknown label:
`[80968d00b78a91f47b233eaa213576293d16dadcbbdceb257bca94b08451ba7f]`

This new representation is the labelhash of the original unnormalized label (including its square brackets) enclosed in square brackets. This demonstrates why square brackets must be considered unindexable - they create ambiguity between literal labels and the unknown label representation format.

When ENSNode encounters an unindexable label, it will represent it as an unknown label even if the actual label data is available. This is a safety mechanism to ensure data integrity and consistent behavior across the system.

For more detailed information about unindexable labels and their handling, please refer to the [ENSNode utils implementation](https://github.com/namehash/ensnode/blob/main/packages/ensnode-utils/src/subname-helpers.ts#L14-L70).
