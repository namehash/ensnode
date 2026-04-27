---
"ensadmin": patch
---

Fix ENSAdmin GraphiQL docs sidebar failing to stay open on the omnigraph page. The editor now memoizes its fetcher, storage, and plugins so 1Hz parent re-renders (driven by the realtime indexing-status projection) no longer trigger schema re-introspection
