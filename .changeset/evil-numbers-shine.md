---
"ensadmin": minor
---

Refactored avatar URL handling to use centralized utilities from `ensnode-sdk`
Removed duplicate `buildEnsMetadataServiceAvatarUrl` and `buildUrl` functions in favor of SDK exports
Updated `ens-avatar` component to use new avatar URL utilities
