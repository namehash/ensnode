---
"ensapi": minor
---

Adds HCA-aware `Event.sender` to the Omnigraph API alongside the existing `Event.from`. For ENSv2 events that emit an explicit `sender`/`owner`/`account`/ERC1155 `operator` argument, `Event.sender` is set from that argument (the HCA Smart Account address, if used) and falls back to `tx.from` otherwise. Adds a `sender` filter to `EventsWhereInput`. `Account.events` now filters by `sender` (HCA-aware) instead of `tx.from`. Documents HCA-aware semantics on `Domain.owner`, `Registration.registrant`/`unregistrant`, and `*.PermissionsUser.user`.
