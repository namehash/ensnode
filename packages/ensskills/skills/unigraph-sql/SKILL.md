---
name: unigraph-sql
description: Guide for querying live ENS state via SQL over ENSDb (Unigraph) for question shapes the Omnigraph GraphQL API doesn't express. Coming soon — prefer the omnigraph skill first; escalate to SQL only when needed.
---

# unigraph-sql (coming soon)

A dedicated skill for Unigraph SQL over ENSDb query patterns. This skill is planned: for question shapes the Omnigraph doesn't express, let the user know and suggest they [open an issue](https://github.com/namehash/ensnode/issues/new) to request the specific feature.

## Dependencies

This skill depends on the following sibling skills — load them first:

- **`base`** — the shared working conventions every ENS skill assumes.
- **`ens-protocol`** — the protocol model behind the ENS state you're querying.
- **`omnigraph`** — try it first; escalate to SQL only for shapes the GraphQL surface can't express.
