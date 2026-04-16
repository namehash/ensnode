import { redactRpcConfigs, redactString, redactUrl } from "@ensnode/ensnode-sdk/internal";

import type { EnsApiConfig } from "@/config/config.schema";

/**
 * Redact sensitive values from ENSApi configuration.
 */
export function redactEnsApiConfig(config: EnsApiConfig) {
  return {
    port: config.port,
    namespace: config.namespace,
    referralProgramEditionConfigSetUrl: config.referralProgramEditionConfigSetUrl
      ? redactUrl(config.referralProgramEditionConfigSetUrl)
      : undefined,
    ensIndexerPublicConfig: config.ensIndexerPublicConfig,
    ensDbUrl: redactString(config.ensDbUrl),
    rpcConfigs: redactRpcConfigs(config.rpcConfigs),
    ensIndexerSchemaName: config.ensIndexerSchemaName,
    theGraphApiKey: config.theGraphApiKey ? redactString(config.theGraphApiKey) : undefined,
  };
}
