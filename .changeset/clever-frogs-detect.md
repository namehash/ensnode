---
"@ensnode/ensnode-sdk": minor
---

SWRCache `fn` now optionally receives the currently cached result as a parameter, allowing implementations to inspect cached data before deciding whether to return it or fetch fresh data. Fully backward compatible.
