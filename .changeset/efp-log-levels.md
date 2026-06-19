---
"ensindexer": patch
---

Demote expected EFP indexing conditions from `warn` to `debug`: an `ADD_TAG`/`REMOVE_TAG` op referencing an absent list record, and an `UpdateListStorageLocation` with an undecodable payload (e.g. a list encoding a zero chainId). These reflect normal on-chain EFP data — EFP's own API resolves such lists to no records — and previously flooded the logs during EFP indexing.
