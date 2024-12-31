import ethereumPlugin from "./ethereum/ponder.indexing";

/**
 * Main entry point for the Ponder ENS plugins.
 * It tries to activate all the enlisted plugins.
 */
function main() {
  const plugins = [ethereumPlugin];

  for (const plugin of plugins) {
    if (plugin.canActivate) {
      plugin.activate();
    }
  }
}

main();
