import { holesky, mainnet, sepolia } from "viem/chains";

/**
 * Get ENS app URL for wallet address on a supported network
 * @param chainId
 * @param nameOrAddress
 * @returns ENS app URL for supported networks, otherwise undefined
 */
export function getEnsAppUrl(
  chainId: number | undefined,
  nameOrAddress: string,
): string | undefined {
  switch (chainId) {
    case mainnet.id:
      return `https://app.ens.domains/${nameOrAddress}`;
    case sepolia.id:
      return `https://sepolia.app.ens.domains/${nameOrAddress}`;
    case holesky.id:
      return `https://holesky.app.ens.domains/${nameOrAddress}`;
    default:
      return undefined;
  }
}

/**
 * Get avatar URL for given ENS name on a supported network
 * @param chainId
 * @param ensName
 * @returns avatar URL for supported networks, otherwise undefined
 */
export function getEnsAvatarUrl(
  chainId: number | undefined,
  ensName: string | undefined,
): string | undefined {
  if (!ensName) {
    return undefined;
  }

  switch (chainId) {
    case mainnet.id:
      return `https://metadata.ens.domains/mainnet/avatar/${ensName}`;
    case sepolia.id:
      return `https://metadata.ens.domains/sepolia/avatar/${ensName}`;
    case holesky.id:
      // NOTE: there's no metadata api available for holesky network
      return undefined;
    default:
      return undefined;
  }
}
