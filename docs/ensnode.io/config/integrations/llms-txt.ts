import starlightLlmsTxt from "starlight-llms-txt";

/**
 * `starlight-llms-txt` renders each docs entry for `/llms-full.txt` and `/llms-small.txt` through
 * an Astro container that only registers the MDX SSR renderer, not React. MDX pages that import
 * `.tsx` islands must be omitted from those exports or `astro build` fails with `NoMatchingRenderer`.
 *
 * Patterns use micromatch against each entry's `id` in the Starlight `docs` collection
 * (paths are relative to `src/content/docs/`; a folder's `index.mdx` uses the folder path as `id`,
 * e.g. `docs/integrate` for `docs/integrate/index.mdx`).
 */
export const starlightLlmsTxtPlugin = starlightLlmsTxt({
  exclude: ["docs/integrate"],
});
