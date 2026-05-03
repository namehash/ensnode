---
"ensindexer": patch
---

Fixed a bug in `ensv2` plugin where only `UnwrappedEthRegistrarController` was indexed; `LegacyEthRegistrarController` and `WrappedEthRegistrarController` were silently dropped. Fixes #2048.
