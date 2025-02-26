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
        label: "ENSIndexer",
        items: [
          {
            label: "Quickstart",
            slug: "ensindexer/quickstart",
          },
          {
            label: "Guides",
            autogenerate: { directory: "ensindexer/guides" },
            collapsed: true,
          },
          {
            label: "Reference",
            autogenerate: { directory: "ensindexer/reference" },
            collapsed: true,
          },
        ],
      },
      {
        label: "ENSRainbow",
        items: [
          {
            label: "Quickstart",
            slug: "ensrainbow/quickstart",
          },
          {
            label: "Guides",
            autogenerate: { directory: "ensrainbow/guides" },
            collapsed: true,
          },
          {
            label: "Reference",
            autogenerate: { directory: "ensrainbow/reference" },
            collapsed: true,
          },
        ],
      },
    ],
    editLink: {
      baseUrl: "https://github.com/namehash/ensnode/edit/main/docs/ensnode.io",
    },
  });
}
