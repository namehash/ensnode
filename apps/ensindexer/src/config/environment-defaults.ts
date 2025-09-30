import { ENSIndexerEnvironment } from "@/config/types";
import { DeepPartial, PluginName } from "@ensnode/ensnode-sdk";

/**
 * Environment defaults applied based on SUBGRAPH_COMPAT mode selection.
 *
 * By applying defaults at the environment level, these inputs still undergo full ENSIndexerConfig
 * parsing and validation steps.
 *
 * - `subgraphCompatible`: Provides defaults for legacy ENS Subgraph behavior
 * - `alpha`: Provides defaults for 'alpha' style instances
 */
export const EnvironmentDefaults = {
  subgraphCompatible: {
    plugins: [PluginName.Subgraph].join(","),
    labelSet: { labelSetId: "subgraph", labelSetVersion: "0" },
  },
  alpha: {
    plugins: [
      // TODO: collapse all of these subgraph-specific core plugins into 'subgraph' plugin
      PluginName.Subgraph,
      PluginName.Basenames,
      PluginName.Lineanames,
      PluginName.ThreeDNS,
    ].join(","),
    // TODO: set these to the most up-to-date ENSRainbow Label Set
    labelSet: { labelSetId: "subgraph", labelSetVersion: "0" },
  },
} satisfies Record<string, Partial<ENSIndexerEnvironment>>;

/**
 * Recursively applies partial defaults to an object, setting default values only for undefined properties.
 *
 * @param data - The target object to apply defaults to
 * @param defaults - A partial object containing default values to apply
 * @returns The data object with defaults applied to any undefined properties, including nested objects
 */
export const applyDefaults = <T extends Record<string, any>>(
  data: T,
  defaults: DeepPartial<T>,
): T => {
  const result = { ...data } as any;

  for (const [key, value] of Object.entries(defaults)) {
    // handle nested objects
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = applyDefaults(result[key], value);
      continue;
    }

    if (result[key] === undefined) {
      result[key] = value;
    }
  }

  return result as T;
};
