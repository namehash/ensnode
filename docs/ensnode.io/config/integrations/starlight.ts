import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightThemeRapide from "starlight-theme-rapide";
import starlightSidebarTopics from "starlight-sidebar-topics";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    plugins: [
      starlightThemeRapide(),
      starlightSidebarTopics([
        {
          label: "ENSNode",
          link: "/ensnode/",
          icon: "seti:db",
          items: [
            {
              label: "Using ENSNode",
              collapsed: false,
              autogenerate: { directory: "ensnode/usage" },
            },
            {
              label: "Understanding ENSNode",
              collapsed: true,
              autogenerate: { directory: "ensnode/understanding" },
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
          icon: "seti:javascript",
          items: [
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
          icon: "list-format",
          items: [
            {
              label: "Using ENSAdmin",
              collapsed: false,
              autogenerate: { directory: "ensadmin/usage" },
            },
            {
              label: "Contributing",
              collapsed: true,
              autogenerate: { directory: "ensrainbow/contributing" },
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
  });
}
