---
"@ensnode/ensnode-react": minor
---

Added `useAvatarUrl` hook for resolving ENS avatar URLs with browser-supported protocols
Added `UseAvatarUrlResult` interface for avatar URL query results
Added `UseAvatarUrlParameters` interface for hook configuration
Added `AvatarUrl` type alias for avatar URL objects
Added support for custom fallback functions when avatar uses non-http/https protocols (e.g., `ipfs://`, `ar://`)
Added automatic fallback to ENS Metadata Service for unsupported protocol
