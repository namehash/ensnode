import config from "@/config";

import { publicClients } from "ponder:api";

import { buildIndexedBlockranges } from "@ensnode/ensnode-sdk";
import { LocalPonderClient } from "@ensnode/ponder-sdk";

import { getPluginsRequiredDatasourceNames } from "@/lib/plugin-helpers";

const pluginsRequiredDatasourceNames = getPluginsRequiredDatasourceNames(config.plugins);

const indexedBlockranges = buildIndexedBlockranges(
  config.namespace,
  pluginsRequiredDatasourceNames,
);

export const localPonderClient = new LocalPonderClient(
  config.ensIndexerUrl,
  config.indexedChainIds,
  indexedBlockranges,
  publicClients,
);
