---
"ensapi": minor
---

Introduces THEGRAPH_API_KEY environment variable: if this value is set, on the condition that
the connected ENSIndexer is not sufficiently "realtime", ENSApi's Subgraph API will fallback
to proxying subgraph queries it receives to The Graph's hosted subgraphs using this API key.
