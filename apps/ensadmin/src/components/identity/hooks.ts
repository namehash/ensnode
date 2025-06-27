// import {
//     ENSNamespaceId,
//     ENSNamespaceIds,
//     getEnsAppUrl,
//     getEnsNameAvatarUrl,
//     getENSRootChainId
// } from "@ensnode/datasources";
// import {useEnsName} from "wagmi";
// import {Address} from "viem";
// import {GetEnsNameReturnType} from "@wagmi/core";
//
// //TODO: consider deletion of the hook as a whole as there probably no longer exists any reason to even create it in the first place
//
// //TODO: this is in a very early stage and doesn't work as expected, maybe it should use useQuery!
// //TODO: this will probably have to be renamed
// interface EnsAppData {
//     primaryName: GetEnsNameReturnType | undefined; //TODO: is that the correct name? maybe we could rename it to ensName or just name?
//     namePreviewUrl: URL | undefined;
//     avatarUrl: URL | undefined;
// }
//
// export function useEnsApp(
//     ensNamespaceId: ENSNamespaceId,
//     ownerAddress: Address
// ): EnsAppData {
//     // if the ENS deployment chain is the ens-test-env, show the truncated address and not look up the primary name.
//     if (ensNamespaceId === ENSNamespaceIds.EnsTestEnv) {
//         return {
//             primaryName: undefined,
//             namePreviewUrl: undefined,
//             avatarUrl: undefined
//         };
//     }
//
//     const ensAppBaseUrl = getEnsAppUrl(ensNamespaceId);
//     const chainId = getENSRootChainId(ensNamespaceId);
//
//     // Use the ENS name hook from wagmi
//     const { data: ensName, isError } = useEnsName({
//         ownerAddress,
//         chainId,
//     });
//
//     if (isError){
//         throw new Error(`Primary name lookup failed for owner address: ${ownerAddress}`);
//     }
//
//     return {
//         primaryName: ensName,
//         namePreviewUrl: ensName && ensAppBaseUrl ? new URL(ensName, ensAppBaseUrl) : undefined,
//         avatarUrl: ensName ? getEnsNameAvatarUrl(ensNamespaceId, ensName) : undefined
//     }
// }
