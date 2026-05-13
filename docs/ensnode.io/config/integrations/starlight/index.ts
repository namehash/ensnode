import AstroStarlight from "@astrojs/starlight";
import type { AstroIntegration } from "astro";
import starlightSidebarTopics from "starlight-sidebar-topics";

import { starlightLlmsTxtPlugin } from "../llms-txt";
import { starlightSidebarTopicsConfig } from "./sidebar-topics";

export function starlight(): AstroIntegration {
  return AstroStarlight({
    components: {
      ThemeProvider: "./src/components/overrides/ThemeProvider.astro",
      ThemeSelect: "./src/components/overrides/ThemeSelect.astro",
      SocialIcons: "./src/components/overrides/SocialIcons.astro",
      Hero: "./src/components/overrides/Hero.astro",
      TableOfContents: "./src/components/overrides/TableOfContents.astro",
      Search: "./src/components/overrides/DocsSearch.astro",
      EditLink: "./src/components/overrides/EditLink.astro",
    },
    customCss: [
      "./src/styles/globals.css",
      "./src/styles/starlight.css",
      "@fontsource/inter/100.css",
      "@fontsource/inter/200.css",
      "@fontsource/inter/300.css",
      "@fontsource/inter/400.css",
      "@fontsource/inter/500.css",
      "@fontsource/inter/600.css",
      "@fontsource/inter/700.css",
      "@fontsource/inter/800.css",
      "@fontsource/inter/900.css",
    ],
    plugins: [starlightLlmsTxtPlugin, starlightSidebarTopics(starlightSidebarTopicsConfig)],
    title: "ENSNode",
    disable404Route: true,
    logo: {
      light: "./src/assets/light-logo.svg",
      dark: "./src/assets/dark-logo.svg",
      replacesTitle: true,
    },
    editLink: {
      baseUrl: "https://github.com/namehash/ensnode/edit/main/docs/ensnode.io",
    },
    head: [
      {
        tag: "meta",
        attrs: {
          property: "og:image",
          content: "https://ensnode.io/OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:card",
          content: "summary_large_image",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:image",
          content: "https://ensnode.io/Twitter_OG_image.png",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:title",
          content: "The new multichain indexer for ENSv2",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:description",
          content: "Multichain indexer for ENS with ENS Subgraph backwards compatibility.",
        },
      },
      {
        tag: "meta",
        attrs: {
          name: "twitter:creator",
          content: "@NameHashLabs",
        },
      },
    ],
  });
}
