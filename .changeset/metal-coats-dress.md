---
"ensapi": patch
---

Fix openapi validation errors by adding missing route descriptions

- Add `describeRoute` with tags, summary, description, and responses to `/amirealtime`, `/ensanalytics/referrers`, `/ensanalytics/referrers/:referrer`, `/registrar-actions`, and `/registrar-actions/:parentNode` endpoints
- Add `.describe()` to Zod schema fields for query and path parameters to improve OpenAPI documentation
- Add OpenAPI tags (`Resolution`, `Meta`, `Explore`, `ENSAwards`) to organize endpoints in the spec
- Split optional parent node path param in registrar-actions-api into dedicated handlers to fix OpenAPI validation
