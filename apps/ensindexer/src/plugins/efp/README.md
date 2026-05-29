# EFP Plugin

Indexes the [Ethereum Follow Protocol](https://docs.efp.app) (EFP) — onchain "follow lists" — into
ENSDb, so a single ENSNode process serves both ENS and EFP data. Activate it by including `efp` in
the `PLUGINS` environment variable (mainnet ENS namespace only).

## Contracts indexed

| Contract          | Chain(s)                         | Events                                  |
| ----------------- | -------------------------------- | --------------------------------------- |
| `ListRegistry`    | Base                             | `Transfer`, `UpdateListStorageLocation` |
| `AccountMetadata` | Base                             | `UpdateAccountMetadata`                 |
| `ListRecords`     | Base, Optimism, Ethereum mainnet | `ListOp`, `UpdateListMetadata`          |

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

## Notes

- EFP defines a single List Storage Location type (onchain EVM contract); see
  [the spec](https://docs.efp.app/design/list-storage-location/). Other location types decode to
  `null` and are skipped.
- The canonical association of an Ethereum account with an EFP list is its **primary list**: the
  `primary-list` account-metadata value, valid only when the named list's `user` role matches the
  account (see [Account Metadata](https://docs.efp.app/design/account-metadata/)). ENSApi's Omnigraph
  `efp.primaryList(address)` resolves and validates it.
- Byte decoders for list ops and storage locations live in `lib/` with unit tests.
