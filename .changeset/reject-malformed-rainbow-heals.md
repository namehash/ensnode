---
"@ensnode/ensrainbow-sdk": patch
---

`@ensnode/ensrainbow-sdk` now rejects malformed rainbow records: a healed label whose `labelHash` does not match the requested `labelHash` is considered `NotFound`.
