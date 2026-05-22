---
"ensindexer": patch
---

ENSIndexer no longer crashes on poisoned ENSRainbow records. `labelByLabelHash` now verifies that a healed label actually hashes back to the requested labelHash; a mismatch (e.g. a label set where the label `"007"` was CSV-mangled to `007` while keyed under the labelHash of `"007"`) is logged and treated as unhealable, so the label is stored as an Encoded LabelHash under the correct primary key instead of being written under the wrong one (which previously left the requested labelHash absent and tripped the canonical-name materialization invariant in `ensureDomainInRegistry`).
