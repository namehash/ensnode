---
"ensapi": patch
---

Forward Resolution is no longer disabled on ENSv1-only namespaces when the `ensv2` plugin is enabled. Forward Resolution is only (temporarily) disabled when a namespace has been upgraded to ENSv2. The Resolution API continues to operate in either case, just without Protocol Acceleration (temporarily) when ENSv2 is deployed.
