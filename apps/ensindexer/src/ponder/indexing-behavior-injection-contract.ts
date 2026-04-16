import config from "@/config";

import type { ContractConfig } from "ponder";

import { getENSRootChainId } from "@ensnode/datasources";
import { ENSDB_SCHEMA_CHECKSUM } from "@ensnode/ensdb-sdk";

import type { EnsIndexerConfig } from "@/config/types";

/**
 * Indexing Behavior Dependencies
 *
 * Defines all values that influence the indexing behavior of the ENSIndexer
 * instance.
 */
interface IndexingBehaviorDependencies {
  /**
   * ENS Namespace
   *
   * When `namespace` changes, the datasources used for indexing may change,
   * which influences the indexing behavior.
   */
  namespace: string;

  /**
   * ENSIndexer Plugins
   *
   * When `plugins` change, the indexed chains and contracts may change,
   * which influences the indexing behavior.
   */
  plugins: EnsIndexerConfig["plugins"];

  /**
   * Global Blockrange
   *
   * When `globalBlockrange` changes, the blockrange of indexed chains may change,
   * which influences the indexing behavior.
   */
  globalBlockrange: EnsIndexerConfig["globalBlockrange"];

  /**
   * Subgraph Compatibility
   *
   * When `isSubgraphCompatible` changes, the indexing logic may change,
   * which influences the indexing behavior.
   */
  isSubgraphCompatible: boolean;

  /**
   * Label Set
   *
   * When `labelSet` changes, the label "healing" results may change during indexing,
   * which influences the indexing behavior.
   */
  labelSet: EnsIndexerConfig["labelSet"];

  /**
   * ENSDb Schema Checksum
   *
   * When `ensDbSchemaChecksum` changes, the ENSDb schema definition may have
   * changed, which influences the indexing behavior.
   */
  ensDbSchemaChecksum: string;
}

/**
 * A special "indexing behavior injection" contract config
 *
 * This config does not reference any real onchain contract to be indexed.
 * Instead, it serves as a placeholder to collect all values that influence
 * the indexing behavior of the ENSIndexer instance.
 *
 * This contract config is designed to be injected into the `contracts` field
 * of the Ponder Config object.
 */
interface IndexingBehaviorInjectionContractConfig extends ContractConfig {
  indexingBehaviorDependencies: IndexingBehaviorDependencies;
}

/**
 * Build a contract config placeholder with the necessary fields to be included in
 * the `contracts` field of the Ponder Config.
 */
function buildContractConfigPlaceholder(): ContractConfig {
  return {
    // The placeholder contract does not reference any real chain,
    // but we need to provide a valid chain id to satisfy the ContractConfig type.
    // The ENS Root Chain ID is a reasonable choice since it's guaranteed to be
    // a valid indexed chain ID for any ENSIndexer instance.
    chain: `${getENSRootChainId(config.namespace)}`,
    // The placeholder contract does not have any real ABI,
    // but we need to provide an empty array to satisfy the ContractConfig type.
    abi: [],
  };
}

/**
 * Indexing Behavior Dependencies
 */
const indexingBehaviorDependencies = {
  // while technically not necessary, since these config properties are reflected in the
  // generated ponderConfig, we include them here for clarity
  namespace: config.namespace,
  // Sort plugins to ensure canonical checksum regardless of config order.
  // The actual indexing behavior does not depend on plugin order since:
  // 1. All plugin checks use Array.includes() which is order-independent
  // 2. Plugin execution order is determined by `ALL_PLUGINS`, not config.plugins
  // Sorting ensures consistent Build IDs for semantically identical config.
  plugins: [...config.plugins].sort(),
  globalBlockrange: config.globalBlockrange,
  // these config properties don't explicitly affect the generated ponderConfig and need to be
  // injected here to ensure that, if they are configured differently, ponder generates a unique
  // build id to differentiate between runs with otherwise-identical configs (see above).
  isSubgraphCompatible: config.isSubgraphCompatible,
  labelSet: config.labelSet,
  ensDbSchemaChecksum: ENSDB_SCHEMA_CHECKSUM,
} satisfies IndexingBehaviorDependencies;

/**
 * A special "indexing behavior injection" contract config
 *
 * This config is designed to be injected into the `contracts` field of
 * the Ponder Config object in order to make Ponder create
 * a unique build ID for any changes to {@link indexingBehaviorDependencies}.
 */
export const IndexingBehaviorInjectionContract = {
  ...buildContractConfigPlaceholder(),
  indexingBehaviorDependencies,
} satisfies IndexingBehaviorInjectionContractConfig;
