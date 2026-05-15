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
    "/docs": "/docs/integrate",
    "/ensnode": "/docs/integrate",
    "/ensnode/deploying/railway": "/docs/services/ensrainbow/deploying/railway",
    "/ensnode/concepts/what-is-ensnode": "/docs/reference/what-is-ensnode",
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
    "/docs/integrate/omnigraph/cookbook": "/docs/integrate/omnigraph/examples",
    "/docs/integrate/omnigraph/cookbook/domain-by-name":
      "/docs/integrate/omnigraph/examples/domain-by-name",
    "/docs/integrate/omnigraph/cookbook/find-domains":
      "/docs/integrate/omnigraph/examples/find-domains",
    "/docs/integrate/omnigraph/cookbook/domain-subdomains":
      "/docs/integrate/omnigraph/examples/domain-subdomains",
    "/docs/integrate/omnigraph/cookbook/domain-events":
      "/docs/integrate/omnigraph/examples/domain-events",
    "/docs/integrate/omnigraph/cookbook/domains-by-address":
      "/docs/integrate/omnigraph/examples/domains-by-address",
    "/docs/integrate/omnigraph/cookbook/account-events":
      "/docs/integrate/omnigraph/examples/account-events",
    "/docs/integrate/omnigraph/cookbook/registry-domains":
      "/docs/integrate/omnigraph/examples/registry-domains",
    "/docs/integrate/omnigraph/cookbook/permissions-by-contract":
      "/docs/integrate/omnigraph/examples/permissions-by-contract",
    "/docs/integrate/omnigraph/cookbook/permissions-by-user":
      "/docs/integrate/omnigraph/examples/permissions-by-user",
    "/docs/integrate/omnigraph/cookbook/account-resolver-permissions":
      "/docs/integrate/omnigraph/examples/account-resolver-permissions",
    "/docs/integrate/omnigraph/cookbook/domain-resolver":
      "/docs/integrate/omnigraph/examples/domain-resolver",
    "/docs/integrate/omnigraph/cookbook/namegraph": "/docs/integrate/omnigraph/examples/namegraph",
    "/docs/integrate/integration-options/enssdk/cookbook":
      "/docs/integrate/integration-options/enssdk/example",
    "/docs/integrate/integration-options/enssdk/cookbook/resolution-api":
      "/docs/integrate/integration-options/enssdk/example",
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
