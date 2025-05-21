import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightSidebarTopics from "starlight-sidebar-topics";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    components: {
      ThemeProvider: "./src/components/overrides/ThemeProvider.astro",
      ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      SocialIcons: "./src/components/overrides/SocialIcons.astro",
      Hero: "./src/components/overrides/Hero.astro",
      TableOfContents: "./src/components/overrides/TableOfContents.astro",
      Search: "./src/components/overrides/DocsSearch.astro",
    },
    customCss: [
      "./src/styles/globals.css",
      "./src/styles/pagination.css",
      "./src/styles/sidebar.css",
      "@fontsource/inter/100.css",
      "@fontsource/inter/200.css",
      "@fontsource/inter/300.css",
      "@fontsource/inter/400.css",
      "@fontsource/inter/500.css",
      "@fontsource/inter/600.css",
      "@fontsource/inter/700.css",
      "@fontsource/inter/800.css",
      "@fontsource/inter/900.css",
    ],
    plugins: [
      starlightLlmsTxt(),
      starlightSidebarTopics([
        {
          label: "ENSNode",
          link: "/docs",
          icon: "star",
          items: [
            {
              label: "Overview",
              items: [
                {
                  label: "Quickstart",
                  link: "/docs",
                },
                {
                  label: "What is the ENS Subgraph?",
                  link: "/docs/concepts/what-is-the-ens-subgraph",
                },
                {
                  label: "What is ENSNode?",
                  link: "/docs/concepts/what-is-ensnode",
                },
                {
                  label: "ENSNode Roadmap",
                  link: "/docs/concepts/roadmap",
                },
              ],
            },
            {
              label: "Using ENSNode",
              collapsed: false,
              autogenerate: { directory: "docs/usage" },
            },
            {
              label: "Deploying ENSNode",
              collapsed: true,
              autogenerate: { directory: "docs/deploying" },
            },
            {
              label: "Local ENSNode",
              collapsed: true,
              autogenerate: { directory: "docs/running" },
            },
            {
              label: "Contributing",
              collapsed: true,
              autogenerate: { directory: "docs/contributing" },
            },
            {
              label: "Reference",
              collapsed: true,
              autogenerate: { directory: "docs/reference" },
            },
          ],
        },
        {
          label: "ENSIndexer",
          link: "/ensindexer",
          icon: "star",
          items: [
            {
              label: "Overview",
              items: [
                {
                  label: "What is ENSIndexer?",
                  link: "/ensindexer",
                },
                {
                  label: "What data is indexed?",
                  link: "/ensindexer/indexed-data",
                },
              ],
            },
            {
              label: "Technical Reference",
              items: [
                {
                  label: "Core Concepts",
                  link: "ensindexer/technical-reference/core-concepts",
                },
                {
                  label: "Data Model",
                  link: "ensindexer/technical-reference/data-model",
                },
                {
                  label: "Plugin System",
                  link: "ensindexer/technical-reference/plugin-system",
                },
                {
                  label: "Plugins",
                  collapsed: false,
                  autogenerate: {
                    directory: "ensindexer/technical-reference/plugins",
                  },
                },
              ],
            },
            {
              label: "Using ENSIndexer",
              collapsed: false,
              autogenerate: { directory: "ensindexer/usage" },
            },
            {
              label: "Contributing",
              collapsed: false,
              autogenerate: { directory: "ensindexer/contributing" },
            },
          ],
        },
        {
          label: "ENSRainbow",
          link: "/ensrainbow",
          icon: "star",
          items: [
            {
              label: "Overview",
              items: [
                {
                  label: "Quickstart",
                  link: "/ensrainbow",
                },
                {
                  label: "What is ENSRainbow?",
                  link: "/ensrainbow/overview/what-is-ensrainbow",
                },
              ],
            },
            {
              label: "Using ENSRainbow",
              collapsed: false,
              autogenerate: { directory: "ensrainbow/usage" },
            },
            {
              label: "Deploying ENSRainbow",
              collapsed: true,
              autogenerate: { directory: "ensrainbow/deploying" },
            },
            {
              label: "Contributing",
              collapsed: true,
              autogenerate: { directory: "ensrainbow/contributing" },
            },
          ],
        },
        {
          label: "ENSAdmin",
          link: "/ensadmin",
          icon: "star",
          items: [
            {
              label: "Overview",
              items: [
                {
                  label: "Quickstart",
                  link: "/ensadmin",
                },
                {
                  label: "What is ENSAdmin?",
                  link: "/ensadmin/overview/what-is-ensadmin",
                },
              ],
            },
            {
              label: "Contributing",
              collapsed: true,
              autogenerate: { directory: "ensadmin/contributing" },
            },
          ],
        },
      ]),
    ],
    title: "ENSNode",
    disable404Route: true,
    logo: {
      light: "./src/assets/light-logo.svg",
      dark: "./src/assets/dark-logo.svg",
      replacesTitle: true,
    },
    editLink: {
      baseUrl: "https://github.com/namehash/ensnode/edit/main/docs/ensnode.io",
    },
    head: [
      {
        tag: "meta",
        attrs: {
          property: "og:image",
          content: "https://ensnode.io/OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:card",
          content: "summary_large_image",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:image",
          content: "https://ensnode.io/Twitter_OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:title",
          content: "The new multichain indexer for ENSv2",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:description",
          content:
            "Multichain indexer for ENS with ENS Subgraph backwards compatibility.",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:creator",
          content: "@NameHashLabs",
        },
      },
    ],
  });
}
