import { defineConfig } from "astro/config";

import { sitemap } from "./config/integrations/sitemap";
import { starlight } from "./config/integrations/starlight";

export default defineConfig({
  site: "https://ensrainbow.io",
  integrations: [starlight(), sitemap()],
});
