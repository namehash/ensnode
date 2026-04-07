---
"enssdk": minor
"@ensnode/ensnode-sdk": minor
---

migrate core ENS types and utilities from ensnode-sdk to enssdk. adds typed `namehash`/`labelhash` wrappers, re-exports `Address`/`Hex` from viem, and exports `asLowerCaseAddress`. removes blanket `export * from "enssdk"` re-export from ensnode-sdk — consumers should import enssdk types from `"enssdk"` directly.
