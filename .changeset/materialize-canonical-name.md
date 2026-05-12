---
"ensindexer": minor
"@ensnode/ensdb-sdk": minor
---

**Materialize `Domain.canonicalName`, `canonicalLabelHashPath`, and `canonicalNode`** on every Canonical Domain. Indexes: hash on `canonicalName` (exact lookup), GIN trigram on `canonicalName` (substring), GIN on `canonicalLabelHashPath` (heal cascade), hash on `canonicalNode` (resolver-record joins).
