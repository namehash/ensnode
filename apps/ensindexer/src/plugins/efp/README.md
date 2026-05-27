# EFP Plugin

Indexes the [Ethereum Follow Protocol](https://docs.efp.app) (EFP) — onchain "follow lists" — into
ENSDb, so a single ENSNode process serves both ENS and EFP data. Activate it by including `efp` in
the `PLUGINS` environment variable (mainnet ENS namespace only).

## Contracts indexed

| Contract          | Chain(s)                         | Events                                     |
| ----------------- | -------------------------------- | ------------------------------------------ |
| `ListRegistry`    | Base                             | `Transfer`, `UpdateListStorageLocation`    |
| `AccountMetadata` | Base                             | `UpdateAccountMetadata`                    |
| `ListRecords`     | Base, Optimism, Ethereum mainnet | `ListOp`, `UpdateListMetadata`             |
| `Resolver`        | Ethereum mainnet (address-less)  | `TextChanged` (filtered to `eth.efp.list`) |

Contract coordinates live in the `EFPBase` / `EFPOptimism` / `EFPEthereum` datasources
(`packages/datasources/src/mainnet.ts`).

## Tables (`packages/ensdb-sdk/src/ensindexer-abstract/efp.schema.ts`)

- `efp_lists` — one row per list NFT (owner / user / manager + decoded storage location).
- `efp_list_storage_locations` — reverse index from a storage location `(chainId, contract, slot)`
  to its list NFT, so `UpdateListMetadata` resolves the owning list by primary key.
- `efp_list_records` / `efp_list_record_tags` — the records in each list and their tags.
- `efp_account_metadata` — `(address, key) → value` (today only `primary-list`).
- `efp_pending_list_metadata` — staging for `user`/`manager` updates that arrive before the list's
  storage location is known (the `ListRecords` and `ListRegistry` contracts emit independently).
- `efp_ens_list_pointers` — `eth.efp.list` text record → EFP list NFT, joinable to ENS names by `node`.

## Notes

- EFP defines a single List Storage Location type (onchain EVM contract); see
  [the spec](https://docs.efp.app/design/list-storage-location/). Other location types decode to
  `null` and are skipped.
- The `eth.efp.list` Resolver subscription indexes `TextChanged` across every mainnet resolver
  (address-less, like Protocol Acceleration) and filters to the well-known key in the handler.
- Byte decoders for list ops, storage locations, and the text record live in `lib/` with unit tests.
