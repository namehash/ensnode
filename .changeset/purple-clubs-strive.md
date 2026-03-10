---
"ensindexer": patch
---

Add retry-with-backoff for ENSRainbow `heal()` calls during indexing. Transient failures (network errors and server errors) are retried up to 3 times with exponential backoff, with a warning logged on each failed attempt. This prevents a single transient ENSRainbow error from causing indexing to fail.
