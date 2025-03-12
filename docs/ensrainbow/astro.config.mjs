import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],

  vite: {
    ssr: {
      noExternal: ["@namehash/namekit-react"],
    },
  },
});
