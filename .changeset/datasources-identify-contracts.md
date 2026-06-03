---
"@ensnode/datasources": patch
---

Add contract identification by address. `@ensnode/datasources` exports `identifyDatasourceContracts(namespaceId, query)`, which finds every well-known contract in a namespace's datasources whose address matches a given address, optionally scoped to a chain.
