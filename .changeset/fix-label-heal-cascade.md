---
"ensindexer": patch
---

Fix the Label heal cascade silently never firing. `ensureLabel` read `prev` via `context.ensDb.find` (a live reference to Ponder's in-memory buffered row) and then evaluated the heal check `prev.interpreted !== interpreted` _after_ the `onConflictDoUpdate`, which mutates that same object in place — so the check always read the just-written value and was never true. As a result, a Domain whose label was healed _after_ the Domain's `canonicalName` had already been materialized (e.g. an ENSv1 Domain whose `[labelHash]` leaf label is later healed via an ENSv2 subname sharing that label) kept a stale `[labelHash]` `canonicalName` even though its `Label` row was correctly healed. The heal decision is now snapshotted before the upsert.
