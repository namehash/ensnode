---
"enskit": patch
"@ensnode/ensnode-sdk": patch
---

allow `Account` entities to be normalized by `address` when `id` is not selected, eliminating urql graphcache warnings on queries like `owner { address }`. updated sepolia-v2 example query variables to point at names/addresses present in the current deployment.
