import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightSidebarTopics from "starlight-sidebar-topics";
import starlightThemeRapide from "starlight-theme-rapide";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    plugins: [
      starlightThemeRapide(),
      starlightSidebarTopics([
        {
          label: "ENSNode",
          link: "/ensnode/",
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
                  label: "What is ENSNode?",
                  link: "/ensnode/concepts/what-is-ensnode",
                },
                {
                  label: "What is ENS Subgraph?",
                  link: "/ensnode/concepts/what-is-the-ens-subgraph",
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
          label: "ENSRainbow",
          link: "/ensrainbow/",
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
          link: "/ensadmin/",
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
          content: "/OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          property: "twitter:image",
          content: "/Twitter_OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          property: "twitter:title",
          content: "The new multichain indexer for ENSv2",
        },
      },
      {
        tag: "meta",
        attrs: {
          property: "twitter:description",
          content: "Multichain indexer for ENS with ENS Subgraph backwards compatibility.",
        },
      },
    ],
  });
}
