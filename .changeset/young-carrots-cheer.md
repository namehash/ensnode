---
"ensrainbow": patch
"@ensnode/ensrainbow-sdk": patch
---

Adds `/v1/config` endpoint to ENSRainbow API returning public configuration (version, label set, records count) and deprecates `/v1/version` endpoint. The new endpoint provides comprehensive service discovery capabilities for clients.

Server startup now requires an initialized database (with a precalculated record count). Run ingestion before starting the server so `/v1/config` is accurate and the service is ready to serve. If the database is empty or uninitialized, startup fails with a clear error directing you to run ingestion first.
