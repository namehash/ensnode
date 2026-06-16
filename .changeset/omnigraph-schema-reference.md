---
"@ensnode/ensnode-sdk": patch
"enssdk": patch
---

Add offline Omnigraph schema lookup helpers (`lookupOmnigraphSchema`, `buildCondensedSchemaReference`) on `@ensnode/ensnode-sdk/internal` for enscli, ENSApi MCP, and ensskills. Export bundled SDL via `enssdk/omnigraph/schema-sdl` so schema loading works in Vite/Rollup builds without Node `createRequire`.
