---
"@ensnode/ensnode-react": patch
---

Fix tanstack-query missing-queryFn warning when `useRecords`, `usePrimaryName`, and `usePrimaryNames` are called in a disabled state. Extracted a shared `DISABLED_QUERY` constant that uses `skipToken` as `queryFn`.
