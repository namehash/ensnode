---
"ensapi": minor
---

**Omnigraph (breaking)**: `where: { name }` on `Query.domains`, `Account.domains`, `Registry.domains`, and `Domain.subdomains` now takes a `DomainsNameFilter` `@oneOf` input with three modes: `starts_with` (prefix autocomplete, the previous behavior), `eq` (exact InterpretedName match — sugar for `in: [eq]`), and `in` (exact match against a set of up to 100 InterpretedNames). The old shape `where: { name: "examp" }` becomes `where: { name: { starts_with: "examp" } }`; for exact lookups use `where: { name: { eq: "vitalik.eth" } }` or `where: { name: { in: ["alice.eth", "bob.eth"] } }`. Combine with `version` to disambiguate across ENS protocol versions (e.g. `{ name: { eq: "eth" }, version: ENSv1 }` returns a single Domain).
