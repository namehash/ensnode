---
"ensapi": patch
---

Forward Resolution now fully delegates to the `UniversalResolver` whenever records cannot be accelerated, correctly implementing the [ENSv2-Readiness](https://docs.ens.domains/web/ensv2-readiness/) check for `ur.integration-test.eth`. Unaccelerated requests are always delegated to the `UniversalResolver`.
