---
"ensindexer": minor
---

BREAKING: Removed ENSNODE_PUBLIC_URL, ENSADMIN_URL, PORT configuration variables. PORT is still overridable, and defaults to Ponder's default (of 42069) as before. Removes "ENSAdmin Loopback" behavior when accessing ENSIndexer at '/'.
