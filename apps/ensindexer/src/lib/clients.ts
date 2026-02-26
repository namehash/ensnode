import config from "@/config";

import { publicClients } from "ponder:api";

import { LocalPonderClient } from "@ensnode/ponder-sdk";

import { buildChainsBlockrange } from "@/config/chains-blockrange";

const chainsBlockrange = buildChainsBlockrange(config.namespace, config.plugins);

export const localPonderClient = new LocalPonderClient(
  config.ensIndexerUrl,
  config.indexedChainIds,
  chainsBlockrange,
  publicClients,
);
