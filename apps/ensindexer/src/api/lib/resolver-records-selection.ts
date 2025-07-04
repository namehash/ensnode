import { CoinType } from "@ensnode/ensnode-sdk";

/**
 * Encodes a selection of Resolver records in the context of a specific Name.
 */
export interface ResolverRecordsSelection {
  // TODO: support legacy addr() record?

  /**
   * Whether to fetch the name's `name` record.
   */
  name?: boolean;

  /**
   * Which coinTypes to fetch address records for.
   */
  addresses?: CoinType[];

  /**
   * Which keys to fetch text records for.
   */
  texts?: string[];

  // TODO: include others as/if necessary
}
