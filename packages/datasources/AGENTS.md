# @ensnode/datasources

Catalog of ENS contract configs (chain, address, ABI, startBlock, event filters) per ENS namespace. Public npm package — `src/index.ts` exports are external API surface; renaming/removing an export or a `DatasourceName`/contract key is a breaking change and needs a changeset.

## Concepts

- **ENSNamespace** = one logically-isolated set of ENS names with its own root Registry. The four: `mainnet`, `sepolia`, `sepolia-v2` (ENSv1+v2 on Sepolia), `ens-test-env` (deterministic Anvil deployment). They are NOT interchangeable with L1 chains — a namespace spans many chains. See `lib/types.ts` for the canonical definitions.
- **Datasource** = `{ chain, contracts }` for one chain within a namespace, keyed by `DatasourceName` (`ensroot`, `basenames`, `lineanames`, reverse-resolver `rr*`, `threedns*`, `seaport`, `ENSv2Root`). `ensroot` is the only Datasource present in every namespace; the type system enforces this (`getDatasource` only allows `ensroot` for a non-literal `namespaceId` — use `maybeGetDatasource` otherwise).
- **ContractConfig** = `{ abi, startBlock, address?, endBlock? }`. A contract with NO `address` is matched by event signature across the whole chain (e.g. `Resolver`) — these are skipped by `identifyDatasourceContracts`. `EventFilter`/`ContractConfig` are intentionally subsets of Ponder's types so plugins can spread them directly into `createConfig`.

## Invariants (enforced by `invariants.test.ts`)

- Every `address` must be a valid viem Address AND fully lowercase (enssdk `NormalizedAddress`). Never paste a checksummed address.
- `startBlock` = the block the contract was deployed (or, for addressless event-filter contracts, the earliest block worth indexing). Getting it wrong silently drops early events; it is not validated by tests.
- Use `endBlock` only when a contract was decommissioned (see Basenames `RegistrarController`).

## Gotchas

- ABIs live in `src/abis/<group>/` as `as const` arrays; their numbered/grouped suffixes (`Resolver1`, `DefaultPublicResolver4`, …) and `// NOTE:` comments encode real provenance (which proposal enabled them, whether they emit events, why some are documented-but-not-indexed). Preserve these comments — they are the only record of why an entry exists.
- `ResolverABI` and `AnyRegistrar*ABI` (`src/lib/`) are `mergeAbis(...)` unions, not a single contract's ABI. A "Resolver" here is any contract emitting ANY of the merged events, not all.
- `ens-test-env` / devnet addresses come from `src/devnet/constants.ts` (deterministic contracts-v2 deploy via `pnpm devnet`); devnet uses different PascalCase contract names than this catalog — the `// NOTE: named X in devnet` comments map them. All devnet `startBlock`s are `0`.
- `ensTestEnvChain` (`src/lib/chains.ts`) is Anvil pinned to chainId 31337; it backs all integration tests against `ens-test-env`.

## Cross-package contract

- ENSIndexer plugins (`apps/ensindexer/src/plugins/*`) declare `requiredDatasourceNames`, pull configs via `getRequiredDatasources` / `pickContracts`, and spread each `ContractConfig` into Ponder `createConfig`. Adding a contract to a Datasource does nothing until a plugin references it; a plugin requiring a Datasource that a namespace lacks fails at config time.
