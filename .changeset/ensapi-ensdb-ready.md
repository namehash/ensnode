---
"ensapi": patch
---

ENSApi now waits for ENSDb to become ready before initializing its dependency graph. This prevents startup crashes when ENSApi starts before the relevant ENSNode Metadata record is available in ENSDb instance.
