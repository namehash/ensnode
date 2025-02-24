import AstroStarlight from "@astrojs/starlight";
import { type AstroIntegration } from "astro";
import starlightThemeRapide from "starlight-theme-rapide";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    plugins: [starlightThemeRapide()],
    title: "ENSRainbow",
    social: {
      github: "https://github.com/namehash/ensnode",
    },
    editLink: {
      baseUrl: "https://github.com/namehash/ensnode/edit/main/docs/ensrainbow.io",
    },
  });
}
