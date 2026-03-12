---
"ensapi": minor
---

ENSNode GraphQL API: Add `where` filters to all `*.events` connections (`Domain.events`, `Resolver.events`, `Permissions.events`, `Account.events`). Supports filtering by `topic0_in`, `timestamp_gte`, `timestamp_lte`, and `from` (where applicable). Also adds `Account.events` field to find events by transaction sender.
