import { redactRpcConfigs, redactString } from "@ensnode/ensnode-sdk/internal";

import type { ENSIndexerConfig } from "@/config/types";

/**
 * Redact sensitive values from ENSIndexer configuration.
 */
export function redactENSIndexerConfig(config: ENSIndexerConfig) {
  return {
    ...config,
    databaseUrl: redactString(config.databaseUrl),
    rpcConfigs: redactRpcConfigs(config.rpcConfigs),
  };
}
