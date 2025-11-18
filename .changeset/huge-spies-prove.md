---
"ensadmin": minor
---

Refactored `ConfigInfoAppCard` to use a composable children-based API, converting all components (ENSApi, ENSDb, ENSIndexer, ENSRainbow, and Connection) to use the new `<ConfigInfoItems>`, `<ConfigInfoItem>`, `<ConfigInfoFeatures>`, and `<ConfigInfoFeature>` components for better flexibility and styling control.
