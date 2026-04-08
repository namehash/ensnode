import { redactRpcConfigs, redactString } from "@ensnode/ensnode-sdk/internal";

import type { EnsApiConfig } from "@/config/config.schema";

/**
 * Redact sensitive values from ENSApi configuration.
 */
export function redactEnsApiConfig(config: EnsApiConfig) {
  return {
    port: config.port,
    namespace: config.namespace,
    customReferralProgramEditionConfigSetUrl: config.customReferralProgramEditionConfigSetUrl,
    ensIndexerPublicConfig: config.ensIndexerPublicConfig,
    ensDbUrl: redactString(config.ensDbUrl),
    rpcConfigs: redactRpcConfigs(config.rpcConfigs),
    ensIndexerSchemaName: config.ensIndexerSchemaName,
    theGraphApiKey: config.theGraphApiKey ? redactString(config.theGraphApiKey) : undefined,
  };
}
