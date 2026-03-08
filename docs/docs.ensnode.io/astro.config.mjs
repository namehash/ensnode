import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { mintlify } from "@mintlify/astro";

export default defineConfig({
  integrations: [mintlify({ docsDir: "./docs" }), react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
