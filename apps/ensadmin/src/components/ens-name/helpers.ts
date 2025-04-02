import { ENSDeploymentChain } from "@ensnode/ens-deployments";

/**
 * Get ENS app URL for wallet address on a supported network.
 * NOTE: not every ENS deployment has an ENS app URL.
 * @param {ENSDeploymentChain} chain
 * @returns ENS app URL for supported networks, otherwise undefined
 */
export function getEnsAppUrl(chain: ENSDeploymentChain): URL | undefined {
  switch (chain) {
    case "mainnet":
      return new URL(`https://app.ens.domains/`);
    case "sepolia":
      return new URL(`https://sepolia.app.ens.domains/`);
    case "holesky":
      return new URL(`https://holesky.app.ens.domains/`);
    case "ens-test-env":
      // ens-test-env cannot be served by app.ens.domains website
      return undefined;
  }
}

/**
 * Get metadata URL for a given ENS deployment
 * NOTE: not every ENS deployment has an ENS metadata URL.
 * @param {ENSDeploymentChain} chain
 * @returns metadata URL for supported networks, otherwise undefined
 */
export function getEnsMetadataUrl(chain: ENSDeploymentChain): URL | undefined {
  switch (chain) {
    case "mainnet":
      return new URL(`https://metadata.ens.domains/mainnet/avatar/`);
    case "sepolia":
      return new URL(`https://metadata.ens.domains/sepolia/avatar/`);
    case "holesky":
      // NOTE: there's no metadata api available on metadata.ens.domains website for the holesky network
      return undefined;
    case "ens-test-env":
      // ens-test-env cannot be served by metadata.ens.domains website
      return undefined;
  }
}
