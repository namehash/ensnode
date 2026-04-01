import config from "@/config";

import { publicClients } from "ponder:api";

import { buildIndexedBlockranges } from "@ensnode/ensnode-sdk";
import { deserializePonderAppContext, LocalPonderClient } from "@ensnode/ponder-sdk";

import { getPluginsAllDatasourceNames } from "@/lib/plugin-helpers";

if (!globalThis.PONDER_COMMON) {
  throw new Error("PONDER_COMMON must be defined by Ponder at runtime as a global variable.");
}

const ponderAppContext = deserializePonderAppContext(globalThis.PONDER_COMMON);
const pluginsAllDatasourceNames = getPluginsAllDatasourceNames(config.plugins);
const indexedBlockranges = buildIndexedBlockranges(config.namespace, pluginsAllDatasourceNames);

export const localPonderClient = new LocalPonderClient(
  config.indexedChainIds,
  indexedBlockranges,
  publicClients,
  ponderAppContext,
);
