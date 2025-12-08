import { redactRpcConfigs, redactString } from "@ensnode/ensnode-sdk/internal";

import type { EnsApiConfig } from "@/config/config.schema";

/**
 * Redact sensitive values from ENSApi configuration.
 */
export function redactEnsApiConfig(config: EnsApiConfig) {
  return {
    ...config,
    databaseUrl: redactString(config.databaseUrl),
    rpcConfigs: redactRpcConfigs(config.rpcConfigs),
  };
}
