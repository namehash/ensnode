---
name: ENSRainbow client retry wrapper
overview: Add a retry wrapper around the ENSRainbow API client in ensindexer so that transient failures on heal() during indexing trigger a few retries with backoff and a warning per failure. One error should not cause disproportionate trouble. Retry policy via parameters in code (options object with defaults). Only heal() is retried; config/health/count/version are plain delegation.
todos: []
isProject: false
---

# ENSRainbow client graceful retry (issue #214)

## Context

- **Issue**: [ENSRainbow client graceful retry mechanism (#214)](https://github.com/namehash/ensnode/issues/214) — add retry with backoff for client network errors and log a warning on each failure.
- **Scope**: Implementation in **ensindexer** only, as a **wrapper** around the existing ENSRainbow client; “just try again few times.”
- **Primary concern**: `**heal()` during indexing** — when the indexer calls `labelByLabelHash()` (from Registry, Registrar, ThreeDNSToken, label-db-helpers), a single transient error (network blip or HealServerError) can cause indexing to fail. The retry mechanism should prevent one error from causing disproportionate trouble; retry policy is controlled by **parameters in code** (options object with defaults), not env variables.

Current flow:

- [apps/ensindexer/src/lib/ensraibow-api-client.ts](apps/ensindexer/src/lib/ensraibow-api-client.ts) — factory `getENSRainbowApiClient()` returns a raw `EnsRainbowApiClient`.
- **Heal path**: [apps/ensindexer/src/lib/graphnode-helpers.ts](apps/ensindexer/src/lib/graphnode-helpers.ts) calls `ensRainbowApiClient.heal(labelHash)`; on throw it rewrites the error message and rethrows (no retry).
- **Config path**: [apps/ensindexer/src/lib/public-config-builder/singleton.ts](apps/ensindexer/src/lib/public-config-builder/singleton.ts) and [public-config-builder.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.ts) use the same client for `config()`.

The SDK uses `fetch()`; network failures cause `heal()` to throw (or return HealServerError). Applying the wrapper at the factory ensures `heal()` gets retries without touching handlers.

## Approach

Introduce a **wrapper class** that implements `EnsRainbow.ApiClient` and delegates to the real client. **Only `heal()`** is wrapped with retry + backoff and a warning on each failure. All other methods (`config`, `health`, `count`, `version`, `getOptions`) are **plain delegation** (no retry). Return this wrapper from `getENSRainbowApiClient()`. Retry policy via **parameters in code** (options object with defaults, e.g. `retries: 3`, `minTimeout: 1000`). One type-annotation change in public-config-builder (client type → `EnsRainbow.ApiClient`).

Use **p-retry** (already a dependency in ensindexer) for the heal() retry loop; `onFailedAttempt`: `console.warn`.

## Implementation

### 1. Retry wrapper module

**New file**: `apps/ensindexer/src/lib/ensrainbow-client-with-retry.ts`

- **Options (parameters in code)**: Wrapper (or factory) accepts an optional options object with e.g. `retries`, `minTimeout`, `maxTimeout`; **defaults in code** (e.g. `retries: 3`, `minTimeout: 1000`). No env. Used only for `heal()`.
- **Wrapper class**: Implements `**EnsRainbow.ApiClient`** (SDK interface). Implement every method; **only `heal()`** uses p-retry; all others (`config`, `health`, `count`, `version`, `getOptions`) **delegate directly** (no retry).
  - **heal()**: Call inner client; if it **throws** (network/fetch failure), retry with p-retry and `onFailedAttempt`: `console.warn`. If it **returns** **HealServerError** (`isHealError(response) && response.errorCode === ErrorCode.ServerError`), treat as retryable and retry; if it returns **HealSuccess**, **HealNotFoundError**, or **HealBadRequestError**, return that response (no retry).
  - **heal() semantics**: SDK `heal()` returns a union (`HealSuccess | HealNotFoundError | HealServerError | HealBadRequestError`) and does not throw on HTTP errors; it only throws on network/fetch failure. HealServerError is the non-cacheable, transient case (`errorCode === ErrorCode.ServerError`). Retry on throw and on returned HealServerError; do not retry on HealNotFoundError or HealBadRequestError.
- **Logging**: `console.warn` in `onFailedAttempt` (e.g. “ENSRainbow heal failed (attempt N): . M retries left.”).
- **Typing**: Wrapper implements `EnsRainbow.ApiClient`; factory return type `EnsRainbow.ApiClient`. In [public-config-builder.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.ts) change client type to `EnsRainbow.ApiClient`.

### 2. Wire wrapper in the client factory

**File**: [apps/ensindexer/src/lib/ensraibow-api-client.ts](apps/ensindexer/src/lib/ensraibow-api-client.ts)

- Construct the real `EnsRainbowApiClient`, then create the wrapper with optional retry options (defaults in code). Return the wrapper. Factory return type: `EnsRainbow.ApiClient`.
- In [public-config-builder.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.ts), change client field and constructor param type to `EnsRainbow.ApiClient`.

### 3. Tests

- **New**: `apps/ensindexer/src/lib/ensrainbow-client-with-retry.test.ts` — mock inner client; success on first call → no retry; throw then success → retry then success; throw every time → retry then rethrow; returned HealServerError → retry; returned HealNotFoundError/HealBadRequestError → no retry, return that response; `console.warn` called on each failed attempt.
- **Existing**: [graphnode-helpers.test.ts](apps/ensindexer/src/lib/graphnode-helpers.test.ts), [public-config-builder.test.ts](apps/ensindexer/src/lib/public-config-builder/public-config-builder.test.ts) — still pass; update mock types to `EnsRainbow.ApiClient` if builder type changes.

## Out of scope

- SDK changes; config() retry; worker changes; env for retry; per-method config map. Add a changeset when implementing.

## Summary


| Item        | Action                                                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New wrapper | `ensrainbow-client-with-retry.ts` — implement `EnsRainbow.ApiClient`; **retry only heal()** (on throw and on returned HealServerError); options in code (e.g. retries: 3, minTimeout: 1000); other methods delegate; warn on each retried failure. |
| Factory     | `ensraibow-api-client.ts` — return wrapper, return type `EnsRainbow.ApiClient`.                                                                                                                                                                    |
| Call sites  | public-config-builder.ts: client type → `EnsRainbow.ApiClient`.                                                                                                                                                                                    |
| Tests       | New wrapper tests (heal retry, HealServerError retry, HealNotFoundError/HealBadRequestError no retry, console.warn); existing tests still pass.                                                                                                    |


