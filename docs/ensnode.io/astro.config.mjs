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
    "/ensnode/deploying/railway": "/docs/services/ensrainbow/deploying/railway",
    "/ensnode/concepts/what-is-the-ens-subgraph":
      "/docs/reference/subgraph-legacy/what-is-the-ens-subgraph",
    "/docs/reference/what-is-the-ens-subgraph":
      "/docs/reference/subgraph-legacy/what-is-the-ens-subgraph",
    "/docs/reference/querying-best-practices":
      "/docs/reference/subgraph-legacy/querying-best-practices",
    "/docs/reference/subgraph-compatibility-tooling":
      "/docs/reference/subgraph-legacy/subgraph-compatibility-tooling",
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
