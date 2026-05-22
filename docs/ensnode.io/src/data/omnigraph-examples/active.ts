/**
 * The production-deployed ENSNode version the docs Omnigraph examples are locked to.
 *
 * The production indexer lags `main` by ~1 week (cloud index time), and its GraphQL
 * schema differs from `main` (breaking changes). The docs site deploys from `main` but
 * must render example queries + responses that run against production, so the examples,
 * their responses, and the schema they validate against are frozen per-version under
 * `./versions/<version>/` and selected here.
 *
 * To promote a newly-deployed version: snapshot it (`pnpm omnigraph:snapshot <version>`),
 * fill its responses (`pnpm omnigraph-examples:refresh-responses`), then bump this constant
 * in a one-line PR.
 *
 * Version strings are semver without a leading `v` (e.g. `1.14.0`).
 */
export const ACTIVE_OMNIGRAPH_VERSION = "1.13.1";

/** Strip a leading `v` from version strings (`v1.14.0` → `1.14.0`). */
export function normalizeOmnigraphVersion(version: string): string {
  return version.replace(/^v/, "");
}
