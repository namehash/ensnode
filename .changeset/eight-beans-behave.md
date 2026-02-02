---
"ensapi": minor
---

The experimental ENSv2 API now supports the following Domain filters, namely matching indexed Domains by name prefix.

- `Query.domains(where: { name?: "example.et", owner?: "0xdead...beef" })`
- `Account.domains(where?: { name: "example.et" })`
