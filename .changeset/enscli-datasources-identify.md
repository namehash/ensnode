---
"enscli": patch
---

`enscli` gains `datasources identify <address>`: an offline command that reports which well-known ENS contract an address corresponds to. It accepts a bare address, a chain-scoped `chainId:address`, or full CAIP-10 `eip155:chainId:address`, and `--namespace` (default `mainnet`) selects which namespace to search. A miss returns `{ matches: [] }` with exit code `0`.
