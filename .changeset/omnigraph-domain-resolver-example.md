---
"@ensnode/ensnode-sdk": patch
---

fix Omnigraph `domain-resolver` example: `SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER` now points to `demomigration.eth`, which has an owned resolver with records/permissions/events. The previous name (`sfmonicdebmig.eth`) had no owned resolver, so the example rendered `resolver.assigned: null`.
