import config from "@/config";

import { getENSRootChainId } from "@ensnode/datasources";

import type { EnsIndexerConfig } from "@/config/types";
import { ensDbClient } from "@/lib/ensdb/singleton";

/**
 * Indexing Behavior Dependencies
 *
 * The following values are indexing behavior dependencies:
 * - ENSDb: Schema checksum
 *    - Different ENSDb Schema definitions may influence indexing behavior.
 * - ENSIndexer: config fields
 *    - `namespace`
 *      - Changes the datasources used for indexing, which influences the indexing behavior.
 *    - `plugins`
 *      - Can change the indexed chains and contracts, which influences the indexing behavior.
 *    - `globalBlockrange`
 *      - Changes the blockrange of indexed chains, which influences the indexing behavior.
 *    - `isSubgraphCompatible`
 *      - Changes the indexing logic, which influences the indexing behavior.
 *    - `labelSet`
 *      - Changes the label set used for healing labels during indexing, which influences the indexing behavior.
 */
const indexingBehaviorDependencies = {
  // while technically not necessary, since these configuration properties are reflected in the
  // generated ponderConfig, we include them here for clarity
  namespace: config.namespace,
  plugins: config.plugins,
  globalBlockrange: config.globalBlockrange,
  // these config properties don't explicitly affect the generated ponderConfig and need to be
  // injected here to ensure that, if they are configured differently, ponder generates a unique
  // build id to differentiate between runs with otherwise-identical configs (see above).
  isSubgraphCompatible: config.isSubgraphCompatible,
  labelSet: config.labelSet,
  ensDbSchemaChecksum: ensDbClient.ensDbSchemaChecksum,
} satisfies Pick<
  EnsIndexerConfig,
  "namespace" | "plugins" | "globalBlockrange" | "isSubgraphCompatible" | "labelSet"
> & { ensDbSchemaChecksum: string };

// We use the root chain ID to build a minimal representation of a valid contract config for ENSIndexer.
const rootChainId = getENSRootChainId(config.namespace);

/**
 * Build a special "indexing behavior injection" contracts config for ENSIndexer
 * to inject into `contracts` field of the Ponder config. The contracts config
 * does not represent any real contracts to index, but rather serves as
 * a container for all indexing behavior dependencies that should be reflected
 * in the Ponder build ID.
 */
export function buildIndexingBehaviorInjectionContracts() {
  return {
    IndexingBehaviorInjectionContract: {
      chain: `${rootChainId}`,
      indexingBehaviorDependencies,
    },
  } as const;
}
