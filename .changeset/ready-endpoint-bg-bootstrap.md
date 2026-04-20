---
"ensrainbow": minor
"@ensnode/ensrainbow-sdk": minor
"ensindexer": patch
---

ENSRainbow now starts its HTTP server immediately and downloads/validates its database in the background, instead of blocking container startup behind a netcat placeholder.

- **New `GET /ready` endpoint**: returns `200 { status: "ok" }` once the database is attached, or `503 Service Unavailable` while ENSRainbow is still bootstrapping. `/health` is now a pure liveness probe that succeeds as soon as the HTTP server is listening.
- **503 responses for API routes during bootstrap**: `/v1/heal`, `/v1/labels/count`, and `/v1/config` return a structured `ServiceUnavailableError` (`errorCode: 503`) until the database is ready.
- **New Docker entrypoint**: the container now runs `pnpm --filter ensrainbow run entrypoint` (implemented in Node via `tsx src/cli.ts entrypoint`), which replaces `scripts/entrypoint.sh` and the `netcat` workaround.
- **SDK client**: added `EnsRainbowApiClient.ready()`, plus `EnsRainbow.ReadyResponse` / `EnsRainbow.ServiceUnavailableError` types and `ErrorCode.ServiceUnavailable`.
- **ENSIndexer**: `waitForEnsRainbowToBeReady` now polls `/ready` (via `ensRainbowClient.ready()`) instead of `/health`, so it correctly waits for the database to finish bootstrapping.

**Migration**: if you previously polled `GET /health` to gate traffic on database readiness, switch to `GET /ready` (or `client.ready()`). `/health` is still available and still returns `200`, but it now indicates liveness only.
