---
"ensindexer": minor
---

Added REPLACE_UNNORMALIZED configuration option (defaults to `true`). When enabled, all Label and Name values returned from the Subgraph-Compatible GraphQL API (`/subgraph`) are guaranteed to be [Interpreted Labels](https://ensnode.io/docs/reference/terminology/#interpreted-label) and [Interpreted Names](https://ensnode.io/docs/reference/terminology/#interpreted-name), avoiding edge cases with unnormalized characters by representing unnormalized values as [Encoded LabelHashes](https://ensnode.io/docs/reference/terminology/#rendering-unknown-labels).

