/**
 * TEMPORARY prerelease install pins for `enscli` and `ensskills`.
 *
 * Both packages were introduced *after* the current `v{snapshot.sdkVersion}` release, so — unlike
 * `enssdk`/`enskit` — they are not yet published at `snapshot.sdkVersion`. Until the first official
 * release that publishes them in lockstep with the rest of the suite, docs install snippets pin to
 * the prerelease snapshot build published from `main` (by `release_snapshot.yml`):
 *   - `ENSCLI_ENSSKILLS_NPM_SPEC`: the exact published snapshot version, and
 *   - `ENSCLI_ENSSKILLS_GIT_REF`: the `main` commit that snapshot was built from, so the
 *     `skills add tree/<ref>` URL is pinned to an immutable commit rather than a moving branch.
 *
 * Both refs are functional against the hosted instances running `snapshot.sdkVersion`.
 *
 * Remove this module at the first official release and revert the `enscli`/`ensskills` snippets in
 * `ai-llm.mdx`, `ensskills.mdx`, and `HostedInstanceVersionWarning.astro` back to
 * `snapshot.sdkVersion` / `v${snapshot.sdkVersion}`.
 */
export const ENSCLI_ENSSKILLS_NPM_SPEC = "0.0.0-next-20260603190454";
export const ENSCLI_ENSSKILLS_GIT_REF = "0eec193";
