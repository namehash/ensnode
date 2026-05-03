---
"@ensnode/datasources": patch
"ensindexer": patch
"@ensnode/ensnode-sdk": patch
---

Eliminate zero-address placeholder contracts; merge ENSRoot registrar controllers into a single Ponder contract entry per chain.

- `@ensnode/datasources`: removed `LegacyEthRegistrarController`, `WrappedEthRegistrarController`, and `UniversalRegistrarRenewalWithReferrer` placeholder entries from the `sepolia-v2` namespace, and `UniversalRegistrarRenewalWithReferrer` from `ens-test-env`. These were typed-but-unindexable entries pinned at `address: zeroAddress, startBlock: 0`. `AnyRegistrarControllerABI` now also includes the `UniversalRegistrarRenewalWithReferrer` ABI so its `RenewalReferred` event participates in the merged controller dispatch.
- `ensindexer`:
  - `registrars` and `subgraph` plugins: the four per-controller Ponder contract entries (`Legacy`, `Wrapped`, `Unwrapped`, `URRWR`) are replaced by a single `RegistrarController` entry per chain that uses the merged `AnyRegistrarControllerABI`. Controller addresses are combined into one chain entry via the new `mergedChainConfigForContracts` helper; controllers absent from the active namespace contribute no address. Handlers dispatch by long-form event signature, mirroring `apps/ensindexer/src/plugins/ensv2/handlers/ensv1/RegistrarController.ts`. This removes the namespace-conditional contract-name typesystem problem entirely — the merged entry is always present because at least one controller (`UnwrappedEthRegistrarController`) exists in every namespace.
  - `ensv2` plugin: the `RegistrarController` entry's per-chain configs are now built via `mergedChainConfigForContracts` instead of spreading multiple `chainConfigForContract(...)` results into the same `chain: {}` map. The previous spread pattern silently overwrote earlier entries for the same chain id (e.g. on mainnet only `UnwrappedEthRegistrarController` survived; Legacy and Wrapped were dropped). Fixes #2048.
- `@ensnode/ensnode-sdk`: reverted the zero-address skip in `buildIndexedBlockranges` from #2045 — the underlying placeholders no longer exist, so the workaround is unnecessary. `getContractsByManagedName` now treats the optional ENSRoot controllers as `maybeGetDatasourceContract` lookups and filters absent ones, matching the existing Basenames/Lineanames pattern. Together these fix the `historicalTotalBlocks` overshoot that produced `Block 14473749 not found` on sepolia-v2.
