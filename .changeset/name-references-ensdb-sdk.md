---
"@ensnode/ensdb-sdk": minor
---

Add a `(value, coinType)` index on `resolver_address_records` to support reverse lookups of the Names whose `addr()` record points at a given address. Powers `Account.nameReferences` in the Omnigraph API.
