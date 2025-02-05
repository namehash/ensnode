import { PluginConfig, PluginContractNames } from "@namehash/ens-deployments";
import type { ContractConfig, createConfig } from "ponder";
import { createPluginNamespace } from "./plugin-helpers";

export type PonderPluginOptions<PLUGIN_NAME extends keyof PluginContractNames> = Pick<
  ContractConfig,
  "startBlock" | "endBlock"
> &
  PluginConfig<PluginContractNames[PLUGIN_NAME]>;

/**
 * A Ponder Plugin provides a config and an `activate` fn
 */
export interface PonderENSPlugin<PLUGIN_NAME extends keyof PluginContractNames> {
  ownedName: PLUGIN_NAME;
  namespace: ReturnType<typeof createPluginNamespace<PLUGIN_NAME>>;
  createConfig: (options: PonderPluginOptions<PLUGIN_NAME>) => ReturnType<typeof createConfig>;
  activate: VoidFunction;
}
