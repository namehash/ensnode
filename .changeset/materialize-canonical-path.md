---
"ensindexer": minor
"@ensnode/ensdb-sdk": minor
---

**Materialize `Domain.canonicalPath` and `canonicalDepth`** on every Canonical Domain, alongside the existing `canonicalName` / `canonicalLabelHashPath` / `canonicalNode`. `canonicalPath` is the head-first array of ancestor DomainIds (parallel to `canonicalLabelHashPath`); `canonicalDepth` is the label count. Adds a `byCanonicalDepth` btree index for `ORDER BY canonical_depth` (typeahead, depth-ordered browse).
