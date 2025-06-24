import type { ENSNamespaceId } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import type * as PonderMetadata from "@ensnode/ponder-metadata";

/**
 * Metadata namespace for the ENS node.
 * NOTE: This namespace definition will be moved to ENSNode SDK package once it's available.
 */
export namespace EnsNode {
  // TODO: make `EnsNodeMetadata` interface to extend from
  // `MetadataMiddlewareResponse` of ENSNode SDK package (once it's available)
  // as it will include precise types for currently unknown-type fields (i.e. `env.NAMESPACE`)
  /**
   * The status of the ENS node.
   */
  export interface Metadata extends Omit<PonderMetadata.MetadataMiddlewareResponse, "env"> {
    // override the `env` field to include the fields required by the ENSAdmin client
    env: {
      PLUGINS: Array<PluginName>;
      DATABASE_SCHEMA: string;
      NAMESPACE: ENSNamespaceId;
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
