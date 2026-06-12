---
"ensrainbowbeam": minor
---

Add **`EnsRainbowBeam`** (`apps/ensrainbowbeam`) exposing **`POST /api/discover`**, classifies each submitted label literal against ENSNode via **`labels(by: { labelHashes })`** (with client-side chunking aligned to ENSApi batch limits), emits structured JSON Lines to stdout for future sinks, mirrors other apps’ Dockerfile + Compose service patterns (`docker/services/ensrainbowbeam.yml`), and includes MIT **`LICENSE`** in the app directory ([issue \#2003](https://github.com/namehash/ensnode/issues/2003)).
