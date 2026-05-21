---
"@ensnode/ensnode-sdk": patch
---

add three ENSv1 → ENSv2 migration Omnigraph examples: `account-migrated-names` (ENSv1 vs ENSv2 domain counts for an account), `batch-migration-check` (canonical ENSv2 identity for a batch of names), and `eth-by-version` (the .eth TLD's Domain id per protocol version).

also fix the `domain-resolver` example: `SEPOLIA_V2_NAME_WITH_OWNED_RESOLVER` now points to `demomigration.eth`, which has an owned resolver with records/permissions/events. The previous name (`sfmonicdebmig.eth`) had no owned resolver, so the example rendered `resolver.assigned: null`.
