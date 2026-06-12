---
"enssdk": minor
---

The Omnigraph SDK now surfaces `Account.nameReferences` and the `NameReference` type in its generated GraphQL schema and introspection, so typed Omnigraph queries can fetch the Names whose `addr()` record points at an Account.
