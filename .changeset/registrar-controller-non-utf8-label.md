---
"ensindexer": patch
---

**ENSIndexer**: handle non-UTF-8 `string label` args in `RegistrarController:NameRegistered` and `:NameRenewed` events without crashing the indexer. ABI-decoding replaces non-UTF-8 byte sequences with U+FFFD, which then fails the labelhash round-trip. Previously this threw a fatal `Invariant(RegistrarController:NameRegistered)` and aborted the run; now the label is treated as unemitted and the heal path indexes the registration under the canonical `labelHash`.
