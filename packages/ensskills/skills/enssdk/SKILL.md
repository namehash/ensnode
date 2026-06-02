---
name: enssdk
description: Reference for integrating ENS into JavaScript/TypeScript apps with the enssdk library (typed Omnigraph client via gql.tada, hashing, normalization). Coming soon.
---

# enssdk (coming soon)

A dedicated `enssdk` integration skill is planned (typed Omnigraph queries with `gql.tada`, client setup, hashing/normalization helpers). Until then, lean on the skills it depends on.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the underlying protocol (names, hashing, normalization, resolution) the SDK's helpers and types reflect.
- **`omnigraph`** — the query model and data shapes `enssdk` exposes in TypeScript.
