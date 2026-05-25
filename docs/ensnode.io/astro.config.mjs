import { fileURLToPath } from "node:url";

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";
import icon from "astro-icon";
import mermaid from "astro-mermaid";

import { sitemap } from "./config/integrations/sitemap";
import { starlight } from "./config/integrations/starlight";

export default defineConfig({
  site: "https://ensnode.io",
  trailingSlash: "never",
  integrations: [mermaid(), starlight(), sitemap(), react(), mdx(), icon()],
  vite: {
    resolve: {
      alias: {
        "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
        "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
        "@content": fileURLToPath(new URL("./src/content", import.meta.url)),
        "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
        "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
        "@scripts": fileURLToPath(new URL("./src/scripts", import.meta.url)),
        "@styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
        "@workspace": fileURLToPath(new URL("../..", import.meta.url)),
      },
    },
    ssr: {
      noExternal: ["@namehash/namehash-ui"],
    },
    plugins: [tailwindcss()],
  },
  redirects: {
    "/docs": "/docs/integrate",
    "/ensnode": "/docs/integrate",
    "/examples": "/docs/integrate/omnigraph/examples",
    "/ensnode/deploying/railway": "/docs/services/ensrainbow/deploying/railway",
    // ENS Subgraph docs moved from /docs/integrate/subgraph to /docs/integrate/ens-subgraph
    "/docs/integrate/subgraph": "/docs/integrate/ens-subgraph",
    "/docs/integrate/subgraph/examples": "/docs/integrate/ens-subgraph/examples",
    "/docs/integrate/subgraph/examples/with-ensjs": "/docs/integrate/ens-subgraph/examples/with-ensjs",
    "/docs/integrate/subgraph/examples/with-viem": "/docs/integrate/ens-subgraph/examples/with-viem",
    "/docs/integrate/subgraph/schema-reference": "/docs/integrate/ens-subgraph/schema-reference",
    "/docs/integrate/subgraph/querying-best-practices":
      "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/docs/integrate/subgraph/subgraph-dependents": "/docs/integrate/ens-subgraph",
    "/docs/integrate/subgraph/what-is-the-ens-subgraph": "/docs/integrate/ens-subgraph",
    "/docs/integrate/subgraph/subgraph-api": "/docs/integrate/ens-subgraph/schema-reference",
    "/docs/integrate/subgraph/with-ensjs": "/docs/integrate/ens-subgraph/examples/with-ensjs",
    "/docs/integrate/subgraph/with-viem": "/docs/integrate/ens-subgraph/examples/with-viem",
    "/docs/integrate/subgraph/subgraph-compatibility-tooling":
      "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/ensnode/concepts/what-is-the-ens-subgraph": "/docs/integrate/ens-subgraph",
    "/docs/reference/what-is-the-ens-subgraph": "/docs/integrate/ens-subgraph",
    "/docs/reference/querying-best-practices": "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/docs/reference/subgraph-compatibility-tooling":
      "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/docs/reference/subgraph-legacy/what-is-the-ens-subgraph": "/docs/integrate/ens-subgraph",
    "/docs/reference/subgraph-legacy/subgraph-api": "/docs/integrate/ens-subgraph/schema-reference",
    "/docs/reference/subgraph-legacy/querying-best-practices":
      "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/docs/reference/subgraph-legacy/subgraph-compatibility-tooling":
      "/docs/integrate/ens-subgraph/backwards-compatibility",
    "/docs/reference/subgraph-legacy/with-ensjs": "/docs/integrate/ens-subgraph/examples/with-ensjs",
    "/docs/reference/subgraph-legacy/with-viem": "/docs/integrate/ens-subgraph/examples/with-viem",
    "/docs/reference/subgraph-legacy/subgraph-dependents": "/docs/integrate/ens-subgraph",
    "/ensadmin": "/docs/services/ensadmin",
    "/ensapi": "/docs/services/ensapi",
    "/ensdb": "/docs/services/ensdb",
    "/ensindexer": "/docs/services/ensindexer",
    "/ensrainbow": "/docs/services/ensrainbow",
    "/ensrainbow/concepts/label-sets-and-versioning":
      "/docs/services/ensrainbow/concepts/label-sets-and-versioning",
    "/docs/reference/rest-api": "/docs/services/ensapi/reference/api-reference",
    "/docs/integrate/hosted-instances": "/docs/hosted-instances",
    "/docs/integrate/migrate-from-subgraph": "/docs/integrate/ensv2-readiness",
    "/docs/reference/ensnode-v2-notes": "/docs/integrate/ensv2-readiness",
    "/docs/reference/mainnet-registered-subnames-of-subregistries": "/docs/integrate/omnigraph",
    "/docs/reference/roadmap": "/docs/integrate/ensv2-readiness",
    "/docs/reference/what-is-ensnode": "/docs/integrate/why-ensnode",
  },
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      ENSADMIN_URL: envField.string({
        context: "client",
        access: "public",
        default: "https://admin.ensnode.io",
      }),
    },
  },
});
