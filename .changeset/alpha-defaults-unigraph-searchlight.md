---
"ensindexer": minor
---

Update the `alpha` environment defaults: enable the `unigraph` plugin and switch the default ENSRainbow label set to `searchlight`/`1` (replacing the stale `subgraph`/`0` placeholder). EFP is intentionally left out of the default because its datasources are mainnet-only — enable it explicitly (`PLUGINS=…,efp`) on the mainnet namespace where its datasources exist.
