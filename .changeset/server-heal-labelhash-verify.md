---
"ensrainbow": patch
"@ensnode/ensrainbow-sdk": patch
---

Labelhash verification for heal responses now runs in `ensrainbow` (server) instead of `@ensnode/ensrainbow-sdk` (client). Malformed rainbow records — where the stored label does not hash back to the requested `labelHash` — are rejected as `NotFound`.
