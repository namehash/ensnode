# ensnode.io Docs

Astro/Starlight docs site (`@docs/ensnode`). Dev server: `pnpm dev` (http://localhost:4321). Build: `pnpm build` (no separate `astro check` step).

## Content & sidebar

- Docs content lives under `src/content/docs/docs/...` (note the doubled `docs/docs` — the Starlight root is `src/content/docs/`, and every page is namespaced under a `/docs` URL prefix).
- The sidebar is NOT inferred from the file tree. It is hand-authored in `config/integrations/starlight/sidebar-topics/`. Adding a page does nothing until you also add a sidebar entry.
- Sidebar entries reference pages by URL `link`, not by file path — a typo'd link silently 404s rather than failing the build.
- `terminology.mdx` (`src/content/docs/docs/reference/terminology.mdx`) is the canonical glossary. Link to it for term definitions; do not redefine terms inline in other pages unless as an Aside to introduce the important concept (ex: `InterpretedName` Asides).

## Formatting (footgun)

- Two formatters split by file type, both run by root `pnpm lint` — always lint from the monorepo root, not from this dir.
  - Prettier (config: root `.prettierrc.json`) formats `.md`/`.mdx`/`.astro` prose/templates.
  - Biome formats TS (incl. `.astro` frontmatter, `config/`, `scripts/`, `src/**/*.ts`). This dir's `biome.jsonc` disables lint rules and import-organizing; it's formatting-only.
- Prettier is configured with `embeddedLanguageFormatting: off` for `docs/ensnode.io/**/*.{md,mdx}`: hand-authored GraphQL/code blocks are NOT reflowed. Don't expect fenced code to be auto-formatted.

## Generated / committed artifacts

- `ensapi-openapi.json` is committed and rendered by Scalar on the API Reference page. Regenerate via `pnpm generate:openapi` (or `pnpm generate`) from the monorepo root after changing `apps/ensapi` route schemas. CI's `openapi-sync-check` fails on drift.
- The OpenAPI spec and the Omnigraph snapshot are the two build inputs the docs read from disk rather than live — both must be regenerated + committed when their upstream source changes.

## Omnigraph examples pipeline (two steps)

The docs do NOT read SDK example queries directly — they render a vendored snapshot in `src/data/omnigraph-examples/` (`examples.json` + `schema.graphql` + `snapshot.json`):

1. `pnpm -F @docs/ensnode omnigraph:snapshot <version>` (e.g. `v1.15.2`) — vendors the workspace SDK's example queries and schema into the snapshot. Required after changing SDK Omnigraph example queries/variables in `packages/ensnode-sdk`; skipping it means step 2 POSTs the stale vendored queries.
2. `pnpm -F @docs/ensnode omnigraph-examples:refresh-responses [<id>,<id>]` (requires network) — POSTs the vendored queries to the hosted instances and updates `responses.json`. Scope to specific example IDs to leave the rest untouched.

The Omnigraph Examples sidebar entries are generated from `src/data/omnigraph-examples/config.ts` (imported into `sidebar-topics/integrate.ts`), not hand-listed.

## llms-txt (gotcha)

- The `starlight-llms-txt` plugin (patched in root `patches/starlight-llms-txt@0.10.0.patch`) generates `/llms.txt`, `/llms-full.txt`, `/llms-small.txt` at build time.
- It renders each page through an MDX-only container with NO React renderer. Any `.mdx` page importing a `.tsx` island (e.g. the GraphQL playground / schema reference) MUST be added to `exclude` in `config/integrations/llms-txt.ts` or `astro build` fails with `NoMatchingRenderer`. Exclude patterns are micromatch on the page `id` (path relative to `src/content/docs/`).

## Misc

- Redirects for moved/renamed pages live in `astro.config.mjs` (`redirects`). Renaming or moving a page means adding a redirect there.
- Path aliases: `@components`, `@content`, `@data`, `@lib`, `@scripts`, `@styles`, `@assets`, `@workspace` (= monorepo root). Defined in `astro.config.mjs`.
- `trailingSlash: "never"` — internal links must omit trailing slashes.
