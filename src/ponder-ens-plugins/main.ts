import basePlugin from "./eth.base/ponder.indexing";
import ethereumPlugin from "./eth/ponder.indexing";

/**
 * Main entry point for the Ponder ENS plugins.
 * It tries to activate all the enlisted plugins.
 */
function main() {
  const plugins = [basePlugin, ethereumPlugin];

  for (const plugin of plugins) {
    if (plugin.canActivate) {
      plugin.activate();
    }
  }
}

main();
