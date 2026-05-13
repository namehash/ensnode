import starlightLlmsTxt from "starlight-llms-txt";

/**
 * `starlight-llms-txt` renders each docs entry for `/llms-full.txt` and `/llms-small.txt` through
 * an Astro container that only registers the MDX SSR renderer, not React. MDX pages that import
 * `.tsx` islands must be omitted from those exports or `astro build` fails with `NoMatchingRenderer`.
 *
 * Patterns use micromatch against each entry's `id` in the Starlight `docs` collection (paths are
 * relative to `src/content/docs/`). Interactive Cookbook recipe pages live under
 * `docs/integrate/integration-options/enssdk/cookbook/*`; the enssdk Cookbook hub (`.../enssdk/cookbook` index) stays static and
 * remains included in LLM exports. Recipe slugs use one path segment (`.../cookbook/<slug>`); add
 * another pattern here if nested recipe routes are introduced.
 */
export const starlightLlmsTxtPlugin = starlightLlmsTxt({
  exclude: ["docs/integrate/integration-options/enssdk/cookbook/*"],
});
