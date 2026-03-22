import config from "@/config";

import { publicClients } from "ponder:api";

import { buildIndexedBlockranges } from "@ensnode/ensnode-sdk";
import { deserializePonderAppContext, LocalPonderClient } from "@ensnode/ponder-sdk";

import { getPluginsAllDatasourceNames } from "@/lib/plugin-helpers";

const pluginsAllDatasourceNames = getPluginsAllDatasourceNames(config.plugins);
const indexedBlockranges = buildIndexedBlockranges(config.namespace, pluginsAllDatasourceNames);
const ponderAppContext = deserializePonderAppContext(globalThis.PONDER_COMMON);

export const localPonderClient = new LocalPonderClient(
  config.ensIndexerUrl,
  config.indexedChainIds,
  indexedBlockranges,
  publicClients,
  ponderAppContext,
);
