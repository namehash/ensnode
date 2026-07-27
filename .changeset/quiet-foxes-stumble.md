---
"@ensnode/ensnode-sdk": patch
---

Fix `makeAccountIdStringSchema` to surface invalid CAIP-10 strings as a Zod issue instead of throwing a synchronous `Error` from inside the transform.
