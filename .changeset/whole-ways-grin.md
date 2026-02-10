---
"ensapi": minor
---

ENSv2 GraphQL API: Introduces order criteria for Domain methods, i.e. `Account.domains(order: { by: NAME, dir: ASC })`. The supported Order criteria are `NAME`, `REGISTRATION_TIMESTAMP`, and `REGISTRATION_EXPIRY` in either `ASC` or `DESC` orders, defaulting to `NAME` and `ASC`.
