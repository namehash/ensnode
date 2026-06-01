---
"ensapi": patch
---

Changes related to **Omnigraph**:

- add `Domain.resolve { records, trace, acceleration, profile? }` for forward resolution driven by the GraphQL selection set
- add `Account.resolve { primaryName(by: ...), primaryNames(where: ...) }` for reverse (ENSIP-19 primary name) resolution with `@oneOf` inputs (`coinType`/`chainName`, `coinTypes`/`chainNames`)
- add `PrimaryNameRecord.resolve { records, ... }` for forward resolution of the resolved primary name
