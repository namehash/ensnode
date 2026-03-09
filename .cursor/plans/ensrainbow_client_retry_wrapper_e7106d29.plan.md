---
name: ENSRainbow client retry wrapper
overview: Add a retry wrapper around the ENSRainbow API client in ensindexer so that network (or transient) failures trigger a few retries with backoff and a warning log per failure, then rethrow. Code lives in ensindexer; the wrapper is applied at the single client factory so all callers (heal and config) get retries without further changes.
todos: []
isProject: false
---

# ENSRainbow client graceful retry (issue #214)

## Context

- **Issue**: [ENSRainbow client graceful retry mechanism (#214)](https://github.com/namehash/ensnode/issues/214) — add retry with backoff for client network errors and log a warning on each failure.
- **Scope**: Implementation in **ensindexer** only, as a **wrapper** around the existing ENSRainbow client; “just try again few times.”

Current flow:

- [apps/ensindexer/src/lib/ensraibow-api-client.ts](apps/ensindexer/src/lib/ensraibow-api-client.ts) — factory `getENSRainbowApiClient()` returns a raw `EnsRainbowApiClient`.
- **Heal path**: [apps/ensindexer/src/lib/graphnode-helpers.ts](apps/ensindexer/src/lib/graphnode-helpers.ts) calls `ensRainbowApiClient.heal(labelHash)`; on throw it rewrites the error message and rethrows (no retry).
- **Config path**: [apps/ensindexer/src/lib/public-config-builder/singleton.ts](apps/ensindexer/src/lib/public-config-builder/singleton.ts) and [public-config-builder.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.ts) use the same client for `config()`.

The SDK uses `fetch()`; network failures (e.g. connection refused, timeout) cause `heal()` / `config()` to throw. Applying the wrapper at the factory ensures both `heal` and `config` get retries without touching handlers or the public config builder.

### Startup and ENSRainbow readiness (no dedicated check today)

Ensindexer does **not** perform a dedicated “is ENSRainbow ready?” check. The first use of ENSRainbow is at **API startup** when the **EnsDbWriterWorker** runs (see [ponder/src/api/index.ts](apps/ensindexer/ponder/src/api/index.ts) → `startEnsDbWriterWorker()` → `worker.run()`). The worker immediately calls `getValidatedEnsIndexerPublicConfig()` → `publicConfigBuilder.getPublicConfig()` → `**ensRainbowClient.config()`**. So “readiness” is implicit: that first `config()` either succeeds or, after the worker’s p-retry (3 retries = 4 attempts with short default backoff), the worker throws and the process exits. If ENSRainbow takes a long time to start (e.g. ~20 minutes), those 4 attempts fail quickly and ensindexer exits before ENSRainbow is ready.

The retry wrapper must therefore support **long-duration wait at startup**: the first `config()` call (and any later `heal()` / `config()`) should be able to retry for a long period (e.g. up to ~20 minutes) so that ensindexer can wait for ENSRainbow to become ready instead of exiting.

## Approach

Introduce a **wrapper class** that implements the same interface as the ENSRainbow client and delegates to the real client, but wraps async I/O methods (`heal`, `config`, and optionally `health`) with retry + backoff and a warning log on each failure. Return this wrapper from `getENSRainbowApiClient()` so all existing call sites stay unchanged.

Reuse **p-retry** (already a dependency in ensindexer) for consistency with [ensdb-writer-worker](apps/ensindexer/src/lib/ensdb-writer-worker/ensdb-writer-worker.ts), which already uses it for config fetch with `onFailedAttempt` and `console.warn`.

## Questions to resolve

Before or during implementation, decide:

1. **Env variables for retry timing**
  - Should retry policy be configurable via env (e.g. `ENSRAINBOW_RETRY_MAX_WAIT_MS`, `ENSRAINBOW_RETRY_MIN_TIMEOUT_MS`, `ENSRAINBOW_RETRY_ATTEMPTS`)?
  - Or use fixed defaults in code (e.g. ~20 min total wait, 40 retries, 30–60s backoff) and add env later if needed?
2. **Health endpoint**
  - Should the wrapper also wrap `health()` with retry (so any code that calls `client.health()` gets the same resilience)?
  - Or only wrap `heal()` and `config()` since those are the only methods used today in ensindexer?
3. **Which errors to retry**
  - Retry on **any** thrown error (simplest; current plan assumption)?
  - Or retry only on **specific** conditions (e.g. network-like: `TypeError`, `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`; or 5xx / 429 from HTTP) and fail fast on 4xx / validation errors?
  - Trade-off: “retry on any” is simpler but may retry on non-transient errors (e.g. bad URL); “retry on specific” avoids that but requires classifying errors and may miss edge cases.

## Implementation

### 1. Retry wrapper module

**New file**: `apps/ensindexer/src/lib/ensrainbow-client-with-retry.ts`

Implement according to the resolved **Questions to resolve** (env for timing or not, health in scope or not, retry-on-any vs retry-on-specific-errors).

- **Options**: Use p-retry with a policy that allows **long-duration wait** so the first call at startup (e.g. `config()` from the worker) can wait for ENSRainbow to become ready (e.g. ~20 minutes). For example: `retries: 40`, `minTimeout: 30_000` (30s), `maxTimeout: 60_000` (60s), exponential backoff — so total wait can span ~20+ minutes. Optional env (e.g. `ENSRAINBOW_STARTUP_MAX_WAIT_MS`) to make this configurable without code changes.
- **Wrapper class**: Implements the same public surface as used by ensindexer:
  - `heal(...)` → delegate with p-retry; `onFailedAttempt`: `console.warn` with attempt and error.
  - `config()` → same.
  - `getOptions()` → delegate with no retry (sync-like, no I/O).
  - Optionally `health()` if needed elsewhere; same retry + warn pattern.
- **Retryable**: Retry on every thrown error from these methods. The SDK’s `heal()` only throws on network/fetch failure (success/error responses are returned); `config()` throws on fetch failure or `!response.ok`. So “retry on throw” matches the issue’s “client network error” focus. No need to distinguish 4xx/5xx in the first version.
- **Logging**: Per issue: “Each failure should write a warning to the logs” — use `console.warn` in `onFailedAttempt` (e.g. “ENSRainbow  failed (attempt N): . M retries left.”).

Type the wrapper as the SDK’s client type (e.g. `EnsRainbowApiClient` or `EnsRainbow.ApiClient`) so the factory return type and all consumers remain unchanged.

### 2. Wire wrapper in the client factory

**File**: [apps/ensindexer/src/lib/ensraibow-api-client.ts](apps/ensindexer/src/lib/ensraibow-api-client.ts)

- After constructing the real `EnsRainbowApiClient`, create the retry wrapper with the chosen options and return the wrapper instead of the raw client.
- No changes to config or to call sites (graphnode-helpers, public-config-builder, singleton).

### 3. Tests

- **New**: `apps/ensindexer/src/lib/ensrainbow-client-with-retry.test.ts`
  - Mock the inner client. Assert: success on first call → no retries, single call. Throw on first N-1 calls then success → N calls, success returned. Throw on all attempts → N calls and final rethrow. At least one test that `console.warn` is called on each failed attempt (and optionally that backoff/delays are used if easily testable).
- **Existing**: [graphnode-helpers.test.ts](apps/ensindexer/src/lib/graphnode-helpers.test.ts) and [public-config-builder.test.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.test.ts) — ensure they still pass; they may mock `getENSRainbowApiClient` or the client methods, so adjust mocks if the wrapper is in the path (e.g. mock the factory to return a mock client that already includes retry behavior, or keep mocking at the factory so the wrapper is not exercised in those tests; either way, no behavior change for “success” paths).

### 4. Optional cleanup

- [graphnode-helpers.ts](apps/ensindexer/src/lib/graphnode-helpers.ts) currently rewrites the error message on throw (“ENSRainbow Heal Request Failed: …”). With the wrapper, the last throw will still happen; that message rewrite can stay as-is so error messages remain clear, or be simplified if the wrapper’s logs already provide context. Low priority.

## Out of scope

- **SDK changes**: Retry stays in ensindexer only; no changes to `packages/ensrainbow-sdk`.
- **Selective retry** (e.g. only 5xx): Omitted for simplicity; retry on any throw. Can be refined later if needed.
- **Changeset**: Add a changeset when implementing (per project workflow).

## Summary


| Item        | Action                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New wrapper | `ensrainbow-client-with-retry.ts` — wrap `heal`, `config`, (optional) `health` with p-retry; warn on each failure                                                                           |
| Factory     | `ensraibow-api-client.ts` — return wrapper around real client                                                                                                                               |
| Tests       | Unit tests for wrapper; confirm existing graphnode-helpers and public-config-builder tests still pass                                                                                       |
| Call sites  | No changes (Registry, Registrar, ThreeDNSToken, label-db-helpers, singleton, public-config-builder)                                                                                         |
| Startup     | Wrapper retry policy must allow ~20 min total wait so first `config()` at worker startup can succeed once ENSRainbow is ready; worker’s existing p-retry (3 retries) stays as second layer. |


