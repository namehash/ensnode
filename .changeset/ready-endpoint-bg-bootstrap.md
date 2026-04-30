---
"ensrainbow": minor
"@ensnode/ensrainbow-sdk": minor
"ensindexer": patch
---

ENSRainbow now starts its HTTP server immediately and downloads/validates its database in the background, instead of blocking container startup behind a netcat placeholder.

- **New `GET /ready` endpoint**: returns `200 { status: "ok" }` once the database is attached, or `503 Service Unavailable` while ENSRainbow is still bootstrapping. `/health` is now a pure liveness probe that succeeds as soon as the HTTP server is listening.
- **503 responses for API routes during bootstrap**: `/v1/heal`, `/v1/labels/count`, and `/v1/config` return a structured `ServiceUnavailableError` (`errorCode: 503`) until the database is ready.
- **New Docker entrypoint**: the container now runs `pnpm run entrypoint` from the `apps/ensrainbow` working directory (implemented in Node via `tsx src/cli.ts entrypoint`), which replaces `scripts/entrypoint.sh` and the `netcat` workaround.
- **Graceful shutdown during bootstrap**: SIGTERM/SIGINT now abort an in-flight bootstrap. Spawned `download`/`tar` child processes are terminated (SIGTERM → SIGKILL after a 5s grace period) and any partially-opened LevelDB handle is closed before the HTTP server and DB-backed server shut down, so the container exits promptly without leaking child processes or LevelDB locks.
- **SDK client**: added `EnsRainbowApiClient.ready()`, plus `EnsRainbow.ReadyResponse` / `EnsRainbow.ServiceUnavailableError` types and `ErrorCode.ServiceUnavailable`. The client now throws a typed `EnsRainbowHttpError` (with structured `status` / `statusText` properties) from `ready()`, `health()`, and `config()` whenever the service responds with a non-2xx HTTP status, so callers can branch their retry/abort logic on the status without parsing message strings.
- **ENSIndexer**: `waitForEnsRainbowToBeReady` now polls `/ready` (via `ensRainbowClient.ready()`) instead of `/health`, so it correctly waits for the database to finish bootstrapping. It also aborts retries immediately on non-503 HTTP responses (e.g. `404` from a misconfigured `ENSRAINBOW_URL`, `500` from a broken instance) instead of blocking startup for ~1h, while still retrying on `503 Service Unavailable` and on transient network errors.

**Migration**: if you previously polled `GET /health` to gate traffic on database readiness, switch to `GET /ready` (or `client.ready()`). `/health` is still available and still returns `200`, but it now indicates liveness only.
