---
name: enskit
description: Reference for building ENS React UIs with enskit (urql-based ENS Omnigraph hooks like useOmnigraphQuery, cache directives, infinite pagination). Coming soon.
---

# enskit (coming soon)

A dedicated `enskit` React integration skill is planned (`useOmnigraphQuery`, the urql-based client, Omnigraph cache directives, infinite pagination). Until then, lean on the skills it depends on.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the protocol model behind the data `enskit` renders.
- **`omnigraph`** — the underlying query model `enskit`'s hooks execute.
