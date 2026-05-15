---
"ensapi": minor
---

**Omnigraph**: add `DEPTH` to the `DomainsOrderBy` enum, ordering by the materialized `Domain.canonicalDepth` (number of labels in the Canonical Name). Applies to `Query.domains`, `Account.domains`, `Registry.domains`, and `Domain.subdomains` via `order: { by: DEPTH }`. Also wired in as the default ordering for `where: { name: { starts_with } }` (typeahead).
