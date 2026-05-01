---
"@ensnode/ensdb-sdk": minor
---

`migrated_nodes` renamed to `migrated_nodes_by_parent` and re-keyed by composite `(parentNode, labelHash)` to match the payload of `ENSv1Registry(Old)#NewOwner` events. New sibling `migrated_nodes_by_node` keyed solely by `node` for the three `ENSv1RegistryOld` handlers (`Transfer` / `NewTTL` / `NewResolver`) that emit only `node`. Both rows are written together by the migration helper so each read site addresses whichever key matches its event payload. Schema definitions live in a new `migrated-nodes.schema.ts`.
