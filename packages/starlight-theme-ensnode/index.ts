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
                  themes: ["vitesse-light"],
                  ...(typeof config.expressiveCode === "object"
                    ? config.expressiveCode
                    : {}),
                },
        });
      },
    },
  };
}
