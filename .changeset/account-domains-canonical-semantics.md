---
"ensapi": patch
---

**Omnigraph**: `AccountDomainsWhereInput.canonical` now filters on both `true` and `false` (previously `false` was a no-op). The `defaultValue: false` is dropped — clients omitting `canonical` will receive all Domains owned by the Account regardless of canonicality. Pass `canonical: true` for canonical-only or `canonical: false` for non-canonical-only. The underlying `DomainsWhere.canonical` in `resolveFindDomains` was generalized so `typeof === "boolean"` triggers the filter; `null`/`undefined` is "no filter".
