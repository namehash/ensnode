---
"ensadmin": minor
---

- Apply `ASSUME_IMMUTABLE_QUERY` to name detail page - avatar and profile data now fetches once and caches forever
- Remove default `refetchInterval` from app-level QueryClient to allow individual queries to control refetch behavior
