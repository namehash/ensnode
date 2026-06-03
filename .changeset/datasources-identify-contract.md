---
"@ensnode/datasources": patch
"enscli": patch
"ensskills": patch
---

Add contract identification by address.

`@ensnode/datasources` exports `identifyDatasourceContracts(namespaceId, query)`, which finds every well-known contract in a namespace's datasources whose address matches a given address, optionally scoped to a chain.

`enscli` gains `datasources identify <address>`: an offline command that reports which well-known ENS contract an address corresponds to. It accepts a bare address, a chain-scoped `chainId:address`, or full CAIP-10 `eip155:chainId:address`, and `--namespace` (default `mainnet`) selects which namespace to search. A miss returns `{ matches: [] }` with exit code `0`. The `enscli` agent skill documents the new command.
