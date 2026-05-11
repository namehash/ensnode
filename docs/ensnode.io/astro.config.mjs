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
    ssr: {
      noExternal: ["@namehash/namehash-ui"],
    },
    plugins: [tailwindcss()],
  },
  redirects: {
    "/docs": "/docs/build-with-ens",
    "/ensnode": "/docs/build-with-ens",
    "/ensnode/deploying/railway": "/docs/services/ensrainbow/deploying/railway",
    "/ensnode/concepts/what-is-ensnode": "/docs/reference/what-is-ensnode",
    "/ensnode/concepts/what-is-the-ens-subgraph": "/docs/reference/what-is-the-ens-subgraph",
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
