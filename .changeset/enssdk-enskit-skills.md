---
"ensskills": minor
---

The `enssdk` and `enskit` skills are now fully authored (previously stubs): `enssdk` covers the typed ENS Omnigraph client (gql.tada), hashing, normalization, and interpretation primitives for TypeScript integrations; `enskit` covers building ENS React UIs (provider setup, typed Omnigraph hooks, caching, Relay pagination). The `ens-protocol` skill also gained the Subgraph-Interpreted Label concept (why subgraph-compatible APIs may return an Encoded LabelHash where the Omnigraph returns the literal label).
