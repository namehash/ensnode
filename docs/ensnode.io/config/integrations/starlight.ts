import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightSidebarTopics from "starlight-sidebar-topics";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    components: {
      ThemeProvider: "./src/components/overrides/ThemeProvider.astro",
      ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      SocialIcons: "./src/components/overrides/SocialIcons.astro"
    },
    customCss: ["./src/styles/globals.css"],
    plugins: [
      starlightSidebarTopics([
        {
          label: "ENSNode",
          link: "/ensnode",
          icon: "star",
          items: [
            {
              label: "Overview",
              items: [
                {
                  label: "Quickstart",
                  link: "/ensnode",
                },
                {
                  label: "What is the ENS Subgraph?",
                  link: "/ensnode/concepts/what-is-the-ens-subgraph",
                },
                {
                  label: "What is ENSNode?",
                  link: "/ensnode/concepts/what-is-ensnode",
                },
                {
                  label: "ENSNode Roadmap",
                  link: "/ensnode/concepts/roadmap",
                },
              ],
            },
            {
              label: "Using ENSNode",
              collapsed: false,
              autogenerate: { directory: "ensnode/usage" },
            },
            {
              label: "Deploying ENSNode",
              collapsed: true,
              autogenerate: { directory: "ensnode/deploying" },
            },
            {
              label: "Local ENSNode",
              collapsed: true,
              autogenerate: { directory: "ensnode/running" },
            },
            {
              label: "Contributing",
              collapsed: true,
              autogenerate: { directory: "ensnode/contributing" },
            },
            {
              label: "Reference",
              collapsed: true,
              autogenerate: { directory: "ensnode/reference" },
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
    logo: {
      light: "./src/assets/light-logo.svg",
      dark: "./src/assets/dark-logo.svg",
      replacesTitle: true,
    },
    social: {
      "x.com": "https://x.com/NamehashLabs",
      github: "https://github.com/namehash/ensnode",
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
