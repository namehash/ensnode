---
"@ensnode/ensrainbow-sdk": minor
---

Added `EnsRainbowApiClient.ready()`, plus `EnsRainbow.ReadyResponse` / `EnsRainbow.ServiceUnavailableError` types and `ErrorCode.ServiceUnavailable`. The client now throws a typed `EnsRainbowHttpError` (with structured `status` / `statusText` properties) from `ready()`, `health()`, and `config()` whenever the service responds with a non-2xx HTTP status, so callers can branch their retry/abort logic on the status without parsing message strings.
