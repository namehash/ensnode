---
"ensadmin": minor
---

- Improved ENSNode config info components with better reusability and maintainability (great for mocking too). Introduced `ENSNodeConfigCardDisplay` component that accepts props and extracted a reusable `ENSNodeCard` wrapper that provides consistent header and loading states.
- Added Suspense boundary around `ConnectionsLibraryProvider` in root layout to better handle hydration
- Added Suspense boundary with skeleton fallback in `LayoutWrapper` to show proper loading states
- Ensures all pages remain statically generated while respecting existing component loading states
