---
name: migrate-to-omnigraph
description: Guide for migrating an app from the legacy ENS Subgraph API to the ENS Omnigraph (rewriting queries, flattening connections, offset→cursor pagination). Coming soon.
---

# migrate-to-omnigraph (coming soon)

A dedicated migration skill is planned: rewriting legacy ENS Subgraph queries onto the ENS Omnigraph, adapting application logic (flattening connections, offset→cursor pagination), and opening feature requests for any gaps. Until then, lean on the skills it depends on.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the protocol model behind both the legacy Subgraph and the Omnigraph.
- **`omnigraph`** — the target datamodel and query patterns you're migrating to.
