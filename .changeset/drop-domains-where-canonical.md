---
"ensapi": minor
---

**Omnigraph (breaking)**: drop the `canonical: Boolean = false` field from `DomainsWhereInput` (used by `Query.domains`). Every nameable Domain is canonical by definition, so the filter was redundant; the query now always scopes to Canonical Domains. Consumers passing `where: { canonical: true }` should drop the field; consumers relying on `canonical: false` (or default) to surface non-canonical Domains via this query no longer can — read `Domain.canonical` directly or scope by `Account.domains` / `Registry.domains` instead.
