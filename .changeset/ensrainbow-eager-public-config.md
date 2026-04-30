---
"ensrainbow": minor
---

ENSRainbow's `GET /v1/config` is now available immediately at startup, removing the cold-start gap that previously forced downstream services (e.g. ENSIndexer) to wait for the entire database download/validation before they could read public config (issue #2020).

- The entrypoint command now builds the `EnsRainbowPublicConfig` in-memory from its CLI/env arguments (`LABEL_SET_ID`, `LABEL_SET_VERSION`) before the HTTP server starts accepting requests, so `/v1/config` returns `200` from the first request.
- After the background bootstrap finishes, ENSRainbow verifies that the on-disk database's stored label set (`labelSetId` and `highestLabelSetVersion`) matches the configured one. On mismatch it logs a helpful error naming both the expected and actual label sets, refuses to serve, and terminates with exit code `1`.
- `/ready` continues to gate on full database readiness (`200` only after the database has been attached and the env-vs-DB validation has passed).
- `/v1/heal/{labelhash}` and `/v1/labels/count` continue to return `503 Service Unavailable` while the database is still bootstrapping.
- `/health` is unchanged and still returns `200` as soon as the HTTP server is listening.
