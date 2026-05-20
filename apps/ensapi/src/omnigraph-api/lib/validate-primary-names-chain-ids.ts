import { DEFAULT_EVM_CHAIN_ID, type DefaultableChainId } from "enssdk";
import { GraphQLError } from "graphql";

export const EMPTY_CHAIN_IDS_MESSAGE = "chainIds cannot be empty.";
export const DEFAULT_CHAIN_ID_WITH_OTHERS_MESSAGE = `Must not include the default EVM chain id (${DEFAULT_EVM_CHAIN_ID}) with other chain ids.`;

/**
 * Validates `chainIds` for primary name resolution.
 *
 * - `undefined` (omitted) is allowed — resolves all ENSIP-19 supported chains.
 * - Empty array is rejected.
 * - `DEFAULT_EVM_CHAIN_ID` (0) is allowed only when it is the sole chain id.
 */
export function validatePrimaryNamesChainIds(
  chainIds: DefaultableChainId[] | null | undefined,
): void {
  if (chainIds === null || chainIds === undefined) return;

  if (chainIds.length === 0) {
    throw new GraphQLError(EMPTY_CHAIN_IDS_MESSAGE);
  }

  if (chainIds.includes(DEFAULT_EVM_CHAIN_ID) && chainIds.length > 1) {
    throw new GraphQLError(DEFAULT_CHAIN_ID_WITH_OTHERS_MESSAGE);
  }
}
