import type { ChainId } from "enssdk";
import { GraphQLError } from "graphql";

export const EMPTY_CHAIN_IDS_MESSAGE = "chainIds cannot be empty.";

/**
 * Validates `chainIds` for primary name resolution.
 *
 * - `undefined` (omitted) is allowed — resolves all ENSIP-19 supported chains.
 * - Empty array is rejected.
 */
export function validatePrimaryNamesChainIds(chainIds: ChainId[] | null | undefined): void {
  if (chainIds === null || chainIds === undefined) return;

  if (chainIds.length === 0) {
    throw new GraphQLError(EMPTY_CHAIN_IDS_MESSAGE);
  }
}
