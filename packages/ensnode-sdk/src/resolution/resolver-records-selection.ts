import { CoinType } from "../ens";
import { ResolverRecordsResponse } from "./resolver-records-response";

/**
 * Encodes a selection of Resolver records in the context of a specific Name.
 */
export interface ResolverRecordsSelection {
  /**
   * Whether to fetch the name's `name` record. This value is primarily used in the context of
   * Reverse Resolution.
   *
   * @see https://docs.ens.domains/ensip/19/#reverse-resolution
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

export const REVERSE_RESOLUTION_SELECTION = {
  name: true,
  texts: ["avatar"],
} as const satisfies ResolverRecordsSelection;

export type ReverseResolutionRecordsResponse = ResolverRecordsResponse<
  typeof REVERSE_RESOLUTION_SELECTION
>;
