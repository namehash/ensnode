/**
 * TEMPORARY prerelease install pins for `enscli` and `ensskills`.
 *
 * Both packages were introduced *after* the current `v{snapshot.sdkVersion}` release, so — unlike
 * `enssdk`/`enskit` — they are not yet published at `snapshot.sdkVersion`. Until the first official
 * release that publishes them in lockstep with the rest of the suite, docs install snippets track:
 *   - `ENSCLI_ENSSKILLS_NPM_SPEC`: the `@next` snapshot dist-tag (published to npm on every push to
 *     `main` by `release_snapshot.yml`), and
 *   - `ENSCLI_ENSSKILLS_GIT_REF`: the `main` branch (where `packages/ensskills/skills` lives;
 *     snapshot releases create no git tag to point at).
 *
 * Remove this module at that first official release and revert the `enscli`/`ensskills` snippets in
 * `ai-llm.mdx`, `ensskills.mdx`, and `HostedInstanceVersionWarning.astro` back to
 * `snapshot.sdkVersion` / `v${snapshot.sdkVersion}`.
 */
export const ENSCLI_ENSSKILLS_NPM_SPEC = "next";
export const ENSCLI_ENSSKILLS_GIT_REF = "main";
