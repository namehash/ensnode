---
"@ensnode/ensnode-sdk": minor
---

**Breaking (`@ensnode/ensnode-sdk`)**: `getRootRegistryIds` is removed; use the new `isRootRegistryId(namespace, registryId)` predicate to test root membership instead. `getRootRegistryId` (singular, "preferred root") is unchanged.

**Breaking (`@ensnode/ensnode-sdk/internal`)**: `BridgedResolverTarget` no longer has a `shadow: boolean` field; it now exposes `registryId: RegistryId` directly (the bridged target Registry's id), removing the need for downstream consumers to derive it.
