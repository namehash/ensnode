import type { ENSNamespaceId } from "@ensnode/datasources";
import { base, baseSepolia, mainnet, optimism, optimismSepolia, sepolia } from "viem/chains";

/**
 * The ChainId of an EFP Deployment..
 *
 * EFP has an allowlisted set of supported chains. This allowlisted set is a function of the ENSNamespace.
 * See {@link getEFPDeploymentChainIds}.
 */
export type EFPDeploymentChainId = number;

/**
 * Get the list of EFP Deployment Chain IDs for the ENS Namespace ID.
 *
 * @param ensNamespaceId - ENS Namespace ID to get the EFP Deployment Chain IDs for
 * @returns list of EFP Deployment Chain IDs on the associated ENS Namespace
 */
export function getEFPDeploymentChainIds(ensNamespaceId: ENSNamespaceId): EFPDeploymentChainId[] {
  switch (ensNamespaceId) {
    case "mainnet":
      return [base.id, optimism.id, mainnet.id];
    case "sepolia":
      return [baseSepolia.id, optimismSepolia.id, sepolia.id];
    default:
      throw new Error(
        `EFP Deployment chainIds are not defined for the ${ensNamespaceId} ENS Namespace ID`,
      );
  }
}
