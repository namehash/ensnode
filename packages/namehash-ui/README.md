# @namehash/namehash-ui

The contained UI components are for reuse across multiple apps developed by the NameHash Labs team, but are highly opinionated according to our specific apps and therefore aren't intended for the general public.

This package also exports the ENSNode React provider and hooks (e.g. `EnsNodeProvider`, `useRecords`, `usePrimaryName`, `usePrimaryNames`, `useResolvedIdentity`, `useIndexingStatus`, `useRegistrarActions`, `useNameTokens`, `useSwrQuery`, etc.).

## Installation

```bash
npm install @namehash/namehash-ui @tanstack/react-query sonner
```

> [!NOTE]
> `@tanstack/react-query` and `sonner` are peer dependencies. `@tanstack/react-query` is required when using the ENSNode hooks/provider exported from this package; `sonner` is only required for the `CopyButton` component. Depending on which components you use, you may not need both installed.

## Setup

The `namehash-ui` package comes with its own styles exported for some components, as well as global Tailwind styles.

Make sure you import the `styles.css` file somewhere in your app:

```tsx
import "@namehash/namehash-ui/styles.css";
```
