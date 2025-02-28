import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightThemeRapide from "starlight-theme-rapide";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    plugins: [starlightThemeRapide()],
    title: "ENSNode",
    logo: {
      light: "./src/assets/light-logo.svg",
      dark: "./src/assets/dark-logo.svg",
    },
    social: {
      github: "https://github.com/namehash/ensnode",
    },
    sidebar: [
      {
        label: "ENSNode",
        collapsed: false,
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
        collapsed: false,
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
    ],
    editLink: {
      baseUrl: "https://github.com/namehash/ensnode/edit/main/docs/ensnode.io",
    },
  });
}
