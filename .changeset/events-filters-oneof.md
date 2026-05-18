---
"ensapi": minor
---

**Omnigraph (breaking)**: filter args on `*.events` and `*.permissions` connections now use operator-based inputs. `EventsWhereInput`/`AccountEventsWhereInput`: `selector_in: [Hex]` → `selector: { eq | in }`, `timestamp_gte`/`timestamp_lte` → `timestamp: { gt?, gte?, lt?, lte? }`, `from`/`sender` → `{ eq | in }`. `DomainPermissionsWhereInput.user` → `{ eq | in }`. `Account.permissions(in: AccountIdInput)` → `Account.permissions(where: { contract: AccountIdInput })`. Set-membership `in` is capped at 10 items; timestamp ranges require ≥1 bound and reject `gt`+`gte` / `lt`+`lte` combinations and inverted bounds.
