---
"ensapi": patch
---

**Omnigraph — interpreted `profile` on forward resolution**

- Implement `Domain.resolve.profile` and `PrimaryNameRecord.resolve.profile` with field parsers driven by the GraphQL selection set (description, avatar/header `httpUrl`, website, validated `email`, multicoin `addresses`, socials)
