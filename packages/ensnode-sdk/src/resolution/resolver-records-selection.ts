import type { CoinType } from "../ens";

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

export const isSelectionEmpty = (selection: ResolverRecordsSelection) =>
  !selection.name && !selection.addresses?.length && !selection.texts?.length;
