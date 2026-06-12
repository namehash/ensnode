import { PluginName } from "@ensnode/ensnode-sdk";

import di from "@/di";

/**
 * Whether the connected ENSIndexer has the EFP plugin active. The EFP query surface (`Query.efp`,
 * `Account.efp`) resolves to `null` when it does not, since no `efp_*` data is indexed.
 */
export function isEfpPluginEnabled(): boolean {
  return di.context.stackInfo.ensIndexer.plugins.includes(PluginName.EFP);
}
