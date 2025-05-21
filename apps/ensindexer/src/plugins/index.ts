import { PluginName } from "@ensnode/utils";

import { requiredDatasources as basenames_requiredDatasources } from "./basenames/basenames.datasources";
import { requiredDatasources as lineanames_requiredDatasources } from "./lineanames/lineanames.datasources";
import { requiredDatasources as subgraph_requiredDatasources } from "./subgraph/subgraph.datasources";
import { requiredDatasources as threedns_requiredDatasources } from "./threedns/threedns.datasources";

export const PLUGIN_REQUIRED_DATASOURCES = {
  [PluginName.Subgraph]: subgraph_requiredDatasources,
  [PluginName.Basenames]: basenames_requiredDatasources,
  [PluginName.Lineanames]: lineanames_requiredDatasources,
  [PluginName.ThreeDNS]: threedns_requiredDatasources,
};
