---
"ensapi": minor
---

Change `Query.permissions` to accept `by: { id, contract }` and `Query.account` to accept `by: { id, address }`, matching the `by` input pattern of `Query.registry` and `Query.resolver`.
