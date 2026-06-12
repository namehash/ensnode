# ENSAdmin

Next.js dashboard for inspecting ENS state from a connected ENSNode instance. Client-only.

## Static export — no server runtime

- `next.config.ts` sets `output: "export"`. There is NO server at runtime: no route handlers, no server components doing fetches, no server actions. `app/api/*/page.tsx` are client pages (GraphiQL / REST explorer UIs), not API routes. The lone `app/api/_ai/route.ts` is fully commented-out dead code.
- Build emits to `out/`; `pnpm start` serves it statically (`serve out`). Docker serves `out/` via nginx.
- Dev and prod both bind port **4173** (`next dev -p 4173`, `serve -l 4173`). `ENSADMIN_PUBLIC_URL` overrides the self-URL used for OG/metadata (`lib/env.ts` `ensAdminPublicUrl`); auto-detected on Vercel.

## Runtime env injection (the static-export gotcha)

- `NEXT_PUBLIC_*` is baked at build time, so it can't configure a prebuilt image. ENSAdmin works around this: `layout.tsx` loads `/runtime-config.js` (`strategy="beforeInteractive"`) which sets `window.__ENSADMIN_RUNTIME_ENVIRONMENT_VARIABLES`. `docker-entrypoint.sh` regenerates that file from container env at startup.
- `getRuntimeEnvVariable()` reads the window object first, falling back to `process.env`. Only `NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY` flows through this path today. Any new container-configurable var must be wired through BOTH `docker-entrypoint.sh` and `getRuntimeEnvVariable`.

## Connection model

- ENSAdmin talks to one selected ENSNode instance at a time. The connection library = server defaults (`NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY`, comma-separated) + user custom URLs persisted in localStorage (`ensadmin:custom-connections:urls`).
- Selected connection lives in the `?connection=<url>` URL param. When building internal links, preserve it via `retainCurrentRawConnectionUrlParam(basePath)` (`use-connection-url-param.tsx`) — basePath must have no existing query/hash.
- `useSelectedConnection()` / `useValidatedSelectedConnection()` THROW if no valid connection is selected; only call them under `<RequireSelectedConnection>` (or `RequireActiveConnection`). `SelectedEnsNodeProvider` bridges the selected URL into namehash-ui's `EnsNodeProvider`.

## Data fetching & display via @namehash/namehash-ui

- ENS reads do NOT happen in this app directly. They go through hooks re-exported from `@namehash/namehash-ui` (workspace pkg): `usePrimaryName`, `usePrimaryNames`, `useRecords`, `useRegistrarActions`. These read from the selected ENSNode via the `EnsNodeProvider` context. react-query (`@tanstack/react-query`) is the cache layer.
- ALWAYS render ENS names with `<NameDisplay name={...} />` (or `EnsAvatar`, `AddressDisplay`, `ChainIcon`, `ChainName`, `RelativeTime`/`AbsoluteTime`) from namehash-ui — never raw name strings. `NameDisplay` beautifies via enssdk's `beautifyName`. Names are typed `Name` from `enssdk`; addresses `Address`. (`lib/beautify-url.ts` is for HTTP URLs, unrelated to ENS name display.)
- Namespace-varying constants (example names/addresses, chain lists) must go through `getNamespaceSpecificValue(namespace, ...)` from `@ensnode/ensnode-sdk`, keyed off `useActiveEnsNodeStackInfo().ensIndexer.namespace`.

## Conventions

- App Router parallel routes: every top-level section has matching `@breadcrumbs/<section>` and `@actions/<section>` slots wired in `layout.tsx`. Adding/moving a route means updating those slots too.
- `app/mock/*` is a component-preview gallery (Storybook-style), not real features. Use it to exercise namehash-ui components against mock data.
- Styling: Tailwind v4 + shadcn-style primitives in `components/ui/` (Radix-based). Match existing component patterns.
