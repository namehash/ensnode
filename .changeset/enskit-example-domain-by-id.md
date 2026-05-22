---
"@ensnode/enskit-react-example": patch
---

Refine Domain links to distinguish ENSv1 vs ENSv2 variants. The Domain browser now has two routes — `/domain/name/:name` (resolves to a name's Canonical Domain) and `/domain/id/:id` (addresses an exact Domain) — both backed by a single `domain(by: DomainIdInput!)` query. Search, Account, and subdomain/parent links now navigate by `DomainId` so clicking the v1 variant of a name lands on the v1 Domain rather than its v2 canonical.
