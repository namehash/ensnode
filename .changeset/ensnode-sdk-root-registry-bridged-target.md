---
"@ensnode/ensnode-sdk": minor
---

**Breaking (`@ensnode/ensnode-sdk`)**: `getRootRegistryIds` is removed; use the new `isRootRegistryId(namespace, registryId)` predicate to test root membership instead. `getRootRegistryId` (singular, "preferred root") is unchanged.
