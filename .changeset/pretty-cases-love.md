---
"@ensnode/ensnode-react": minor
---

- Add `ASSUME_IMMUTABLE_QUERY` constant for queries that should only fetch once per unique key (similar to SWR's `immutable: true`)
- Apply `ASSUME_IMMUTABLE_QUERY` to `useENSIndexerConfig` so the client fetches the config endpoint once and caches forever
- Add 10s `refetchInterval` to `useIndexingStatus` for automatic polling of indexing progress
- Add 10s default `refetchInterval` to `ENSNodeProvider` QueryClient
- Export `ASSUME_IMMUTABLE_QUERY` from package index for use in applications
