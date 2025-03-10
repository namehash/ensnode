import type { ENSDeploymentChain, ENSDeploymentConfig } from "@ensnode/ens-deployments";
import type * as PonderMetadata from "@ensnode/ponder-metadata";

/**
 * Metadata namespace for the ENS node.
 * NOTE: This namespace definition will be moved to ENSNode SDK package once it's available.
 */
export namespace EnsNode {
  // TODO: make `EnsNodeMetadata` interface to extend from
  // `MetadataMiddlewareResponse` of ENSNode SDK package (once it's available)
  // as it will include precise types for currently unknown-type fields (i.e. `env.ENS_DEPLOYMENT_CHAIN`)
  /**
   * The status of the ENS node.
   */
  export interface Metadata extends Omit<PonderMetadata.MetadataMiddlewareResponse, "env"> {
    // override the `env` field to include the fields required by the ENSAdmin client
    env: {
      ACTIVE_PLUGINS: Array<keyof ENSDeploymentConfig>;
      DATABASE_SCHEMA: string;
      ENS_DEPLOYMENT_CHAIN: ENSDeploymentChain;
    };
  }

  /**
   * Basic information about a block in the Ponder status.
   */
  export type BlockInfo = PonderMetadata.BlockInfo;

  /**
   * Network indexing status for a chain.
   */
  export type NetworkIndexingStatus = PonderMetadata.NetworkIndexingStatus;
}
