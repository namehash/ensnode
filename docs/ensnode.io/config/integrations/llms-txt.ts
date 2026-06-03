import starlightLlmsTxt from "starlight-llms-txt";

/**
 * `starlight-llms-txt` renders each docs entry for `/llms-full.txt` and `/llms-small.txt` through
 * an Astro container that only registers the MDX SSR renderer, not React. MDX pages that import
 * `.tsx` islands must be omitted from those exports or `astro build` fails with `NoMatchingRenderer`.
 *
 * Patterns use micromatch against each entry's `id` in the Starlight `docs` collection (paths are
 * relative to `src/content/docs/`).
 *
 * The Interactive example imports a React playground and cannot be rendered by `starlight-llms-txt`.
 * The Schema Reference imports a React playground and cannot be rendered by `starlight-llms-txt`.
 */
export const starlightLlmsTxtPlugin = starlightLlmsTxt({
  exclude: [
    "docs/integrate/integration-options/enssdk/example",
    "docs/integrate/integration-options/enskit/example",
    "docs/integrate/omnigraph/schema-reference",
    "docs/integrate/ens-subgraph/schema-reference",
    "docs/integrate/why-ensnode/keep-ens-working",
  ],
});
