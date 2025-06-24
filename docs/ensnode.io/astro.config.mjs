import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

import { sitemap } from "./config/integrations/sitemap";
import { starlight } from "./config/integrations/starlight";

export default defineConfig({
  site: "https://ensnode.io",
  integrations: [starlight(), sitemap(), react(), mdx()],
  vite: {
    ssr: {
      noExternal: ["@namehash/namekit-react"],
    },
    plugins: [tailwindcss()],
  },
  redirects: {
    "/ensnode": "/docs",
    "/ensnode/deploying/railway": "/docs/deploying/railway",
    "/ensnode/concepts/what-is-ensnode": "/docs/concepts/what-is-ensnode",
    "/ensnode/running/ens-test-env": "/docs/running/ens-test-env",
    "/ensnode/concepts/what-is-the-ens-subgraph": "/docs/concepts/what-is-the-ens-subgraph",
  },
  env: {
    schema: {
      GITHUB_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      ENSADMIN_GRAPHIQL_ENDPOINT: envField.string({
        context: "client",
        access: "public",
        default: "https://admin.ensnode.io/gql/subgraph-compat",
      }),
    },
  },
});
