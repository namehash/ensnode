import type { StarlightPlugin } from "@astrojs/starlight/types";

import { overrideComponents } from "./starlight";

export default function starlightThemeEnsnodePlugin(): StarlightPlugin {
  return {
    name: "starlight-theme-ensnode-plugin",
    hooks: {
      "config:setup"({ config, logger, updateConfig }) {
        updateConfig({
          components: overrideComponents(config, ["ThemeSelect"], logger),
          customCss: [
            ...(config.customCss ?? []),
            "starlight-theme-ensnode/styles",
          ],
          expressiveCode:
            config.expressiveCode === false
              ? false
              : {
                  styleOverrides: {
                    borderColor: "var(--sl-ensnode-ui-border-color)",
                    borderRadius: "0.5rem",
                    frames: {
                      editorActiveTabIndicatorTopColor: "unset",
                      editorActiveTabIndicatorBottomColor:
                        "var(--sl-color-gray-3)",
                      editorTabBarBorderBottomColor:
                        "var(--sl-ensnode-ui-border-color)",
                      frameBoxShadowCssValue: "unset",
                    },
                    textMarkers: {
                      backgroundOpacity: "40%",
                      markBackground: "var(--sl-ensnode-ec-marker-bg-color)",
                      markBorderColor:
                        "var(--sl-ensnode-ec-marker-border-color)",
                    },
                  },
                  themes: ["vitesse-dark", "vitesse-light"],
                  ...(typeof config.expressiveCode === "object"
                    ? config.expressiveCode
                    : {}),
                },
        });
      },
    },
  };
}
