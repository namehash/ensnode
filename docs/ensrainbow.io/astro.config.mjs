import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  trailingSlash: "never",

  vite: {
    ssr: {
      noExternal: ["@namehash/namekit-react", "@namehash/namehash-ui"],
    },
    plugins: [tailwindcss()],
  },
});
