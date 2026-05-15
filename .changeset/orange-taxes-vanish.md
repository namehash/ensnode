---
"ensapi": patch
---

Omnigraph: The Domain interface now exposes `Domain.registry` and `Domain.subregistry` rather than being isolated to the concrete ENSv2 Domain entity, as in the unified model both ENSv1 and ENSv2 Domains have a parent and child Registry.
