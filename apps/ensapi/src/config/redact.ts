import {
  type ReferralProgramCycle,
  serializeReferralProgramCycle,
} from "@namehash/ens-referrals/v1";

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
    // Convert Map to object for proper logging (Maps serialize to {} in JSON)
    referralProgramCycleSet: Object.fromEntries(
      Array.from(config.referralProgramCycleSet.entries()).map(([cycleId, cycle]) => [
        cycleId,
        serializeReferralProgramCycle(cycle as ReferralProgramCycle),
      ]),
    ),
  };
}
