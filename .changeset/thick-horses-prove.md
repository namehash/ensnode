---
"ensapi": minor
---

**Breaking**: Removed Config API endpoint at `GET /api/config`. To get the ENSApi Public Config, call the `GET /api/indexing-status` endpoint and reference the `stackInfo.ensApi` field in the OK response.
