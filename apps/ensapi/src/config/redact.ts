import type { EnsApiConfig } from "@/config/config.schema";
import { redactRpcConfigs, redactString } from "@ensnode/ensnode-sdk/internal";

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
