import { type ENSDeploymentChain } from "@ensnode/ens-deployments";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { getEnsAppUrl, getEnsAvatarUrl } from "./utils";
/**
 * Query ENS App URL for a selected ENS Deployment Chain.
 **/
export function useEnsAppUrlQuery(
  ensDeploymentChain: ENSDeploymentChain,
): UseQueryResult<URL, Error> {
  return useQuery({
    queryKey: ["ens", "appUrl", ensDeploymentChain],
    queryFn() {
      return getEnsAppUrl(ensDeploymentChain);
    },
  });
}

interface ENSAvatarUrlQueryProps {
  ensDeploymentChain: ENSDeploymentChain;
  ensName: string | undefined;
  showAvatar: boolean;
}

/**
 * Query ENS Avatar URL for a given ENS Name on a selected ENS Deployment Chain.
 **/
export function useEnsAvatarUrlQuery({
  showAvatar,
  ensDeploymentChain,
  ensName,
}: ENSAvatarUrlQueryProps) {
  return useQuery({
    // enable avatar URL query only when ensName is defined
    enabled: showAvatar && Boolean(ensName),
    queryKey: ["ens", "addressInfo", "avatarUrl", ensDeploymentChain, ensName],
    queryFn() {
      if (!ensName) {
        throw new Error("ENS Name is required to fetch ENS Avatar URL");
      }

      return getEnsAvatarUrl(ensDeploymentChain, ensName);
    },
  });
}
