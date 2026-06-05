---
"@ensnode/datasources": patch
---

Consolidate UniversalResolver onto the `IUniversalResolver` proxy. Each ENSRoot Datasource now exposes a single `UniversalResolver` contract pointing at the proxy address (`0xeeeeeeee14d718c2b47d9923deab1335e144eeee` on mainnet/sepolia), replacing the separate `UniversalResolver` (V1) and `UniversalResolverV2` contracts. The exported `UniversalResolverABI` is now `IUniversalResolver` merged with `IMulticallable`.
