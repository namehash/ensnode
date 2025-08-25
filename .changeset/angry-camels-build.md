---
"ensindexer": patch
---

Add LABEL_SET_ID and LABEL_SET_VERSION environment variables to ENSIndexer

- Add label set configuration to ENSIndexerConfig, SerializedENSIndexerConfig, and ENSIndexerPublicConfig
- Update indexing behavior dependencies to prevent starting with different label set configurations
- Add configuration schema validation and serialization support
- Enforce Ponder build id changes if configured label set changes
