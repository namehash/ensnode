import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "ENSNode Docs",
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
              label: "Reference",
              autogenerate: { directory: "ensnode/reference" },
              collapsed: true,
            },
          ],
        },

        {
          label: "ENSRainbow",
          collapsed: true,
          items: [
            {
              label: "Quickstart",
              slug: "ensrainbow/quickstart",
            },
          ],
        },
      ],
    }),
  ],
});
