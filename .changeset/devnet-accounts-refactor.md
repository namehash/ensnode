---
"@ensnode/ensnode-sdk": minor
---

Replaces the flat `DEVNET_DEPLOYER` / `DEVNET_OWNER` / `DEVNET_USER` / `DEVNET_USER2` constants exported from `@ensnode/ensnode-sdk/internal` with a single `DevnetAccounts` object that groups each account's `address` and `resolver`. Consumers must migrate to `DevnetAccounts.{deployer,owner,user,user2}.{address,resolver}`.
