---
"ensapi": patch
---

add `Account.domains` and enhance `Domain.subdomains` and `Registry.domains` with filtering and ordering

**`Account.domains`** (new) — paginated connection of domains owned by this account.
- `where: { name?: String, canonical?: Boolean }` — optional partial Interpreted Name filter and canonical filter (defaults to false)
- `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

**`Domain.subdomains`** (enhanced) — paginated connection of subdomains of this domain, now with filtering and ordering.
- `where: { name?: String }` — optional partial Interpreted Name filter
- `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

**`Registry.domains`** (enhanced) — paginated connection of domains in this registry, now with filtering and ordering.
- `where: { name?: String }` — optional partial Interpreted Name filter
- `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering

**`Query.domains`** (updated) — `where.name` is now required. Added optional `where.canonical` filter (defaults to false).
- `where: { name: String!, canonical?: Boolean }` — required partial Interpreted Name, optional canonical filter
- `order: { by: NAME | REGISTRATION_TIMESTAMP | REGISTRATION_EXPIRY, dir: ASC | DESC }` — ordering
