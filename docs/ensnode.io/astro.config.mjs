import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightThemeRapide from 'starlight-theme-rapide'


// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      plugins: [starlightThemeRapide()],
      title: "ENSNode",
      social: {
        github: "https://github.com/namehash/ensnode",
      },
      sidebar: [
        {
          label: "ENSNode",
          items: [
            {
              label: "Quickstart",
              slug: "ensnode/quickstart",
            },
            {
              label: "Guides",
              autogenerate: { directory: "ensnode/guides" },
              collapsed: true,
            },
            {
              label: "Reference",
              autogenerate: { directory: "ensnode/reference" },
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

    }),
  ],
});
