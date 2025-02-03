import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "ENSNode Docs",
      social: {
        github: "https://github.com/namehash/ensnode/tree/main/apps/ensnode",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            {
              label: "Querying best practices",
              slug: "guides/querying-best-practices",
            },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],

  adapter: vercel(),
});
