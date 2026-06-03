---
"enscli": patch
---

Introduce `enscli`, a new agent- and human-friendly CLI for ENS that wraps `enssdk` and the ENS Omnigraph. It supports raw Omnigraph queries (`enscli ensnode omnigraph "<query>" --variables …`), offline schema exploration (`enscli ensnode omnigraph schema [Type[.field]]`), indexing status, ENSRainbow healing, and `namehash`/`labelhash`. It defaults to NameHash-hosted instances per `--namespace` (mainnet, sepolia, sepolia-v2), resolves config from flags/env/`.env`, outputs JSON when piped and a pretty form in a TTY, and hardens inputs against agent hallucinations.
