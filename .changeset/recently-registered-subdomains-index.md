---
"@ensnode/ensdb-sdk": patch
"ensindexer": patch
"ensapi": patch
---

Index-accelerate `REGISTRATION_TIMESTAMP` / `REGISTRATION_EXPIRY`-ordered domain queries (e.g. `Domain.subdomains(order: { by: REGISTRATION_TIMESTAMP, dir: DESC })`). Previously these joined `domains → latest_registration_indexes → registrations` and sorted the full registry partition — ~55s for `.eth`'s subdomains. The latest registration's start/expiry is now mirrored onto the Domain row (`__latestRegistrationStart` / `__latestRegistrationExpiry`) with composite indexes `(registry_id, <col>, id)`, turning the query into an index-ordered scan. The sort columns are NOT NULL — an absent value (no registration, or a never-expiring registration) is materialized as a `+∞` sentinel — so a single plain composite per column serves both directions with a plain keyset tuple, and the sentinel sorts last for ASC and first for DESC.
