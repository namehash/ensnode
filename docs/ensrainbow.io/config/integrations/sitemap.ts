import AstroSitemap from "@astrojs/sitemap";
import { type AstroIntegration } from "astro";

export function sitemap(): AstroIntegration {
  return AstroSitemap();
}
