---
"ensadmin": minor
---

Renamed NEXT_PUBLIC_SERVER_ENSNODE_URLS to NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY
Removed `/connect` page
Added `connection` url parameter to manage the selected connection URL
Added hooks for `useSelectedConnection` and `useRawConnectionUrlParam` for use with the connection url parameter
Refactored the add connection dialog into its own component
Refactored connection list into its own component to handle server and user provided connection URLs
