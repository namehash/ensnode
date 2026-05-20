---
"@ensnode/ensdb-sdk": patch
---

Add three btree indexes to the indexer schema to fix slow `Domain.subdomains`, `get-domain-by-interpreted-name`, and `Query.domains` paths:

- `domain_resolver_relations(domain_id)` — secondary lookup off the PK so the namegraph-walk CTE can left-join by `domain_id` alone.
- `domains(registry_id, label_hash)` — composite (replaces the standalone `registry_id` index, which it subsumes via leading-column prefix).
- `domains(registry_id, left(canonical_name, 256), id)` — expression composite for registry-scoped `WHERE registry_id = X ORDER BY canonical_name LIMIT N` (the `Domain.subdomains` shape). The 256-char prefix bounds the index tuple under btree's per-tuple max; NAME-ordered queries must sort by the same `left(...)` expression for the planner to use this index for ordered scan.
