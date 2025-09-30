import { ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import { mainnet } from "viem/chains";
import { DEFAULT_EVM_CHAIN_ID } from "../ens";
import { ChainId, DefaultableChainId } from "../shared";

/**
 * Gets the "chainId param" that should be used for a primary name resolution
 * request.
 *
 * ENSIP-19 defines special rules for the "chainId param" used
 * in primary name resolutions for the case that the `chainId` is the
 * ENS Root Chain Id for the provided `namespaceId`.
 *
 * Whenever this case happens, ENSIP-19 requires that the
 * "chainId param" is always set to chainId: 1 (mainnet), even if the
 * `chainId` where the primary name lookup is actually happening
 * on a non-mainnet ENS Root Chain, such as on a testnet or
 * the ens-test-env.
 *
 * @param namespaceId The namespace id for the primary name lookup.
 * @param chainId The chain id where the primary name lookup will actually happen.
 * @returns The "chainId param" that should be used for the primary name lookup.
 */
export const getResolvePrimaryNameChainIdParam = (
  chainId: DefaultableChainId,
  namespaceId: ENSNamespaceId,
): DefaultableChainId => {
  const ensRootChainId = getENSRootChainId(namespaceId);
  return chainId === ensRootChainId ? mainnet.id : chainId;
};

/**
 * Translates a `DefaultableChainId` a `ChainId`
 * such that if the provided `chainId` is `DEFAULT_EVM_CHAIN_ID`,
 * the `ChainId` of the ENS Root Chain for the provided `namespaceId` is returned.
 *
 * @param chainId The `DefaultableChainId` to translate.
 * @param namespaceId The namespace id for the translation.
 * @returns the translated `ChainId`.
 */
export const translateDefaultableChainIdToChainId = (
  chainId: DefaultableChainId,
  namespaceId: ENSNamespaceId,
): ChainId => {
  return chainId === DEFAULT_EVM_CHAIN_ID ? getENSRootChainId(namespaceId) : chainId;
};
