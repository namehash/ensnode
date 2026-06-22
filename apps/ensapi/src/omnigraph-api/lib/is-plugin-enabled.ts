import type { PluginName } from "@ensnode/ensnode-sdk";

import di from "@/di";

/**
 * Whether the connected ENSIndexer has the given plugin active. A query surface gated on a plugin
 * (e.g. `Query.efp` / `Account.efp` on the `efp` plugin) resolves to `null` when it is not, since the
 * plugin indexes no data.
 */
export function isPluginEnabled(pluginName: PluginName): boolean {
  return di.context.stackInfo.ensIndexer.plugins.includes(pluginName);
}
