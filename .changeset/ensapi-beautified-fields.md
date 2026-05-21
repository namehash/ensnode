---
"ensapi": minor
---

**Omnigraph**: add `BeautifiedName` and `BeautifiedLabel` scalars, a `CanonicalName.beautified: BeautifiedName!` field, and a `Label.beautified: BeautifiedLabel!` field. These expose the Name/Label beautified per [ENSIP-15](https://docs.ens.domains/ensip/15) for display — continue using `interpreted` for navigation targets and lookup keys.
