---
"ensapi": minor
---

Replaced all eagerly-evaluated reads from `import config from "@/config";` with lazy-evaluated reads from `import di from "@/di";`. This change allows more granual control over internal resources in ENSApi.
