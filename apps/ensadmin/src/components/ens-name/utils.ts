import { type ENSDeploymentChain } from "@ensnode/ens-deployments";
import { type Hex } from "viem";

/**
 * Get ENS app URL for wallet address on a supported network
 * @param ensDeploymentChain
 * @returns ENS app URL for supported networks
 * @throws error when ensDeploymentChain cannot be mapped into an ENS App URL
 */
export function getEnsAppUrl(ensDeploymentChain: ENSDeploymentChain): URL {
  switch (ensDeploymentChain) {
    case "mainnet":
      return new URL("https://app.ens.domains");
    case "sepolia":
      return new URL("https://sepolia.app.ens.domains");
    case "holesky":
      return new URL("https://holesky.app.ens.domains");
    case "ens-test-env":
      throw ensAppUrlUnsupportedDeploymentChainError("ens-test-env");
  }
}

// Create error object for ENS App URL exception
function ensAppUrlUnsupportedDeploymentChainError(ensDeploymentChain: ENSDeploymentChain): Error {
  return new Error(`ENS app is not supported on "${ensDeploymentChain}" ENS Deployment Chain`);
}

/**
 * Get avatar URL for given ENS name on a supported network
 * @param ensDeploymentChain
 * @param ensName
 * @returns avatar URL for supported networks
 * @throws error when ensDeploymentChain cannot be mapped into an ENS App URL
 */
export function getEnsAvatarUrl(ensDeploymentChain: ENSDeploymentChain, ensName: string): URL {
  const ensMetadataUrl = new URL("https://metadata.ens.domains");

  switch (ensDeploymentChain) {
    case "mainnet":
      return new URL(`/mainnet/avatar/${ensName}`, ensMetadataUrl);
    case "sepolia":
      return new URL(`/sepolia/avatar/${ensName}`, ensMetadataUrl);
    case "holesky":
      // NOTE: there's no metadata api available for holesky network
      throw ensAvatarUrlUnsupportedDeploymentChainError("holesky");
    case "ens-test-env":
      throw ensAvatarUrlUnsupportedDeploymentChainError("ens-test-env");
  }
}

// Create error object for Avatar URL exception
function ensAvatarUrlUnsupportedDeploymentChainError(
  ensDeploymentChain: ENSDeploymentChain,
): Error {
  return new Error(
    `ENS Avatar URL is not supported on "${ensDeploymentChain}" ENS Deployment Chain`,
  );
}

export function formatEnsAccountName(address: Hex, ensName: string | undefined) {
  if (!ensName) {
    // fallback to truncated address
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // ENS Name
  return ensName;
}

// narrow down the input value type
export function nullToUndefined<T>(maybeValue: T | undefined | null): T | undefined {
  return maybeValue ?? undefined;
}
