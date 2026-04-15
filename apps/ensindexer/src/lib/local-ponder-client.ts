import config from "@/config";

import { publicClients } from "ponder:api";

import { buildIndexedBlockranges } from "@ensnode/ensnode-sdk";
import { LocalPonderClient } from "@ensnode/ponder-sdk";

import { getPluginsAllDatasourceNames } from "@/lib/plugin-helpers";

import { localPonderContext } from "./local-ponder-context";

const pluginsAllDatasourceNames = getPluginsAllDatasourceNames(config.plugins);
const indexedBlockranges = buildIndexedBlockranges(config.namespace, pluginsAllDatasourceNames);

export const localPonderClient = new LocalPonderClient(
  config.indexedChainIds,
  indexedBlockranges,
  publicClients,
  localPonderContext,
  // Reload-scoped: read fresh on every fetch via the reactive proxy. See
  // local-ponder-context.ts for the staleness contract.
  () => localPonderContext.apiShutdown.abortController.signal,
);
