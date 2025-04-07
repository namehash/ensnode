import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import { sitemap } from "./config/integrations/sitemap";
import { starlight } from "./config/integrations/starlight";
import { autoLinkHeadings as rehypeAutolinkHeadings } from "./config/rehype/autolink-headings";

export default defineConfig({
  site: "https://ensnode.io",
  integrations: [
    starlight(),
    sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    ssr: {
      noExternal: ["@namehash/namekit-react"],
    },
  },
  markdown: {
    rehypePlugins: [rehypeAutolinkHeadings],
  },
});
