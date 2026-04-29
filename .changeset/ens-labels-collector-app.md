---
"ens-labels-collector": minor
"ensapi": minor
"enssdk": minor
---

Add `apps/ens-labels-collector` and a new `Query.labels` Omnigraph field to support label submission collection (issue [#2003](https://github.com/namehash/ensnode/issues/2003)).

- **New app `apps/ens-labels-collector`**: Hono server exposing `POST /api/submissions` that accepts `{ labels: string[], callerAddress: Address }`, classifies each label against ENSNode's index via the typed `enssdk/omnigraph` client, and emits a structured JSON line per submission to stdout. For each submitted raw label the collector computes both the literal labelhash and (when normalizable to a different value) the normalized labelhash, then assigns one of three statuses per label: `unknown_in_index` (referenced in the index but unhealed), `healed_in_index`, or `absent_from_index`. Persistent storage, batched on-chain emission, and a caller-leaderboard are explicitly deferred to follow-up work; the JSON log shape is the future row shape so adding a sink later is mechanical.
- **New ENSApi `Query.labels(by: { hashes: [Hex!]! }): [Label!]!`**: batch lookup of `Label` rows by `LabelHash`. Hashes that are not present in the index are simply omitted from the result. Capped at 100 hashes per request.
- **`enssdk/omnigraph`**: regenerated GraphQL introspection so the new `Query.labels` field is available to the typed `graphql(...)` client.
