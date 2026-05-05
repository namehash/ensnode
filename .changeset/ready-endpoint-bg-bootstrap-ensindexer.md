---
"ensindexer": patch
---

`waitForEnsRainbowToBeReady` now polls `/ready` (via `ensRainbowClient.ready()`) instead of `/health`, so it correctly waits for the database to finish bootstrapping. It also aborts retries immediately on non-503 HTTP responses (e.g. `404` from a misconfigured `ENSRAINBOW_URL`, `500` from a broken instance) instead of blocking startup for ~1h, while still retrying on `503 Service Unavailable` and on transient network errors.
