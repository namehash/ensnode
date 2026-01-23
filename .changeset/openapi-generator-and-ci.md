---
"ensapi": patch
"@docs/mintlify": patch
---

Add OpenAPI spec generation tooling and CI validation

**ENSApi:**

- Add `OPENAPI_CI_CHECK` mode to start ENSApi with mock config for CI validation without external dependencies

**@docs/mintlify:**

- Introduce API documentation for EnsApi that's generated automatically from the OpenAPI spec

**CI:**

- Add `openapi-sync-check` job that validates committed `openapi.json` matches what ENSApi generates
- Add Mintlify OpenAPI validation step
- Trigger Mintlify rebuild on environment switch to keep production docs in sync
