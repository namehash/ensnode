import config from "@/config";

import { PluginName } from "@ensnode/ensnode-sdk";
import { prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

import { redactENSIndexerConfig } from "@/config/redact";
import ponderConfig from "@/ponder/config";

////////
// Log redacted ENSIndexerConfig for debugging.
////////

console.log("ENSIndexer running with config:");
console.log(prettyPrintJson(redactENSIndexerConfig(config)));

// log warning about dual activation of subgraph and ensv2 plugins
if (config.plugins.includes(PluginName.Subgraph) && config.plugins.includes(PluginName.ENSv2)) {
  console.warn(
    `Both the '${PluginName.Subgraph}' and '${PluginName.ENSv2}' plugins are enabled. This results in the availability of both the legacy Subgraph-Compatible GraphQL API (/subgraph) _and_ ENSNode's Omnigraph API (/api/omnigraph), and comes with an associated increase in indexing time. If your intent is to have both APIs available in parallel, excellent, otherwise you may benefit from only enabling the plugin for the API you plan to use.`,
  );
}

////////
// Export the ponderConfig for Ponder to use for type inference and runtime behavior.
////////
export default ponderConfig;
