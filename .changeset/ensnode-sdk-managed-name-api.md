---
"@ensnode/ensnode-sdk": minor
---

Centralized Managed Name and Root Registry helpers.

- **Removed:** `getEthnamesSubregistryId`, `getEthnamesSubregistryManagedName`, `getBasenamesSubregistryId`, `getBasenamesSubregistryManagedName`, `getLineanamesSubregistryId`, `getLineanamesSubregistryManagedName`.
- **Added:** `getManagedName(namespace, contract)` — given any contract in the ENSv1 ecosystem, returns its Managed Name, namehash, and concrete ENSv1 Registry. Replaces the per-plugin helpers above. Also exposes `isNameWrapper(namespace, contract)`.
- **Added:** `getRootRegistryId(namespace)` returns the namespace's primary Root Registry (prefers ENSv2 when defined). `getRootRegistryIds(namespace)` returns every top-level Root Registry — concrete ENSv1 Root, Basenames/Lineanames `base.eth`/`linea.eth` ENSv1VirtualRegistries, and the ENSv2 Root when defined — for consumers that walk the full canonical-set tree.
- **Added:** `getENSv1RootRegistryId(namespace)`.
