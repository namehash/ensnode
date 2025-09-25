import { ENSIndexerEnvironment } from "@/config/types";
import { DeepPartial, PluginName } from "@ensnode/ensnode-sdk";

/**
 * These are defaults for the ENSIndexerConfig's schema. By applying them at the environment level
 * these inputs still go through the ENSIndexerConfig parsing/validation steps.
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
 * Applies partial defaults to an object iff the property in question is undefined.
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
