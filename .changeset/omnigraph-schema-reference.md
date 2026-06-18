---
"@ensnode/ensnode-sdk": patch
---

Add offline Omnigraph schema lookup helpers (`lookupOmnigraphSchema`, `buildCondensedSchemaReference`) on `@ensnode/ensnode-sdk/internal` for enscli and ensskills. Bundle Omnigraph SDL in ensnode-sdk (generated from `enssdk/omnigraph/schema.graphql`) so schema loading works in Vite/Rollup builds without Node `createRequire`.
