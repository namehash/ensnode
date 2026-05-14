---
"@namehash/namehash-ui": major
"ensadmin": patch
---

Eliminate the `@ensnode/ensnode-react` package; its provider, context, hooks, and query utilities are now exported from `@namehash/namehash-ui`.

## How to migrate

- Replace `@ensnode/ensnode-react` imports with `@namehash/namehash-ui`
- Import `QueryClient` from `@tanstack/react-query`
- Import `ResolverRecordsSelection` from `@ensnode/ensnode-sdk`
- `@tanstack/react-query` is now a peer dependency of `@namehash/namehash-ui`
