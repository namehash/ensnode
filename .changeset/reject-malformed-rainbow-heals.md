---
"@ensnode/ensrainbow-sdk": patch
---

ensrainbow-sdk now rejects malformed rainbow records: a healed label whose labelhash does not match the requested labelHash is treated as unhealable. This prevents ENSIndexer from crashing on such records.
