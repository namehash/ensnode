---
"ensindexer": minor
---

Added REPLACE_UNNORMALIZED configuration option (defaults to `true`). When enabled, all stored Label and Name values are guaranteed to be [Interpreted Labels](https://ensnode.io/docs/reference/terminology/#interpreted-label) and [Interpreted Names](https://ensnode.io/docs/reference/terminology/#interpreted-name), avoiding edge cases with unnormalized characters by representing unnormalized values as [Encoded LabelHashes](https://ensnode.io/docs/reference/terminology/#rendering-unknown-labels) of the Literal Label value found onchain.
