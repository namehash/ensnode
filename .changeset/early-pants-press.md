---
"ensindexer": minor
---

`ALCHEMY_API_KEY` and `DRPC_API_KEY` may now be set in lieu of `RPC_URL_*` environment variables. If specified the `RPC_URL_*` value will take precedence over Alchemy and DRPC RPCs. If both Alchemy and DRPC are specified, they will be used in the following priority: Alchemy > DRPC.
