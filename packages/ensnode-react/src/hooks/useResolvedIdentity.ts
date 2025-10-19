"use client";

import {
  ENSNamespaceId,
  Identity,
  NamedIdentity,
  ResolutionStatusIds,
  ResolvedIdentity,
  UnknownIdentity,
  UnnamedIdentity,
  UnresolvedIdentity,
  getResolvePrimaryNameChainIdParam,
} from "@ensnode/ensnode-sdk";
import { usePrimaryName } from "./usePrimaryName";

// TODO: `namespaceId` ideally would not be a parameter for this hook.
//       Ideally it should come from the active namespace context and be a nested hook within this hook.
//       However, currently this hook lives in ENSAdmin and not in `ensnode-react`.
/**
 * Parameters for the useResolvedIdentity hook.
 */
export interface UseResolvedIdentityParameters {
  identity: UnresolvedIdentity;
  namespaceId: ENSNamespaceId;
}

/**
 * Hook to perform ENSIP-19 primary name resolution to resolve an
 * {@link UnresolvedIdentity} into a {@link ResolvedIdentity}.
 *
 * @param parameters - Configuration object for the hook
 * @param parameters.identity - An {@link UnresolvedIdentity} containing the {@link DefaultableChainId}
 *                              and {@link Address} to resolve.
 * @param parameters.namespaceId - The {@link ENSNamespaceId} that `identity.chainId` should be interpreted
 *                                 through (via {@link getResolvePrimaryNameChainIdParam}) to determine the literal
 *                                 chainId that should be used for ENSIP-19 primary name resolution.
 *
 * @returns An object containing:
 * - `identity`: An {@link Identity} with one of four possible {@link ResolutionStatusIds}:
 *   - {@link ResolutionStatusIds.Unresolved}: While the query is pending (loading state).
 *   - {@link ResolutionStatusIds.Unknown}: If an error occurs during resolution.
 *   - {@link ResolutionStatusIds.Unnamed}: If the resolution found no primary name.
 *   - {@link ResolutionStatusIds.Named}: If a primary name is successfully resolved.
 * - All other properties from the underlying {@link usePrimaryName} query (e.g., `isLoading`, `error`, `refetch`, etc.)
 */
export function useResolvedIdentity(parameters: UseResolvedIdentityParameters) {
  const { identity, namespaceId, ...args } = parameters;

  const {
    data: primaryNameData,
    status,
    ...query
  } = usePrimaryName({
    address: identity.address,
    chainId: getResolvePrimaryNameChainIdParam(identity.chainId, namespaceId),
    ...args,
  });

  let result: Identity;

  if (status === "pending") {
    // loading state
    // return the `UnresolvedIdentity` to support loading state functionality.
    result = identity;
  } else if (status === "error") {
    result = {
      resolutionStatus: ResolutionStatusIds.Unknown,
      chainId: identity.chainId,
      address: identity.address,
    } satisfies UnknownIdentity;
  } else if (primaryNameData.name === null) {
    result = {
      resolutionStatus: ResolutionStatusIds.Unnamed,
      chainId: identity.chainId,
      address: identity.address,
      name: null,
    } satisfies UnnamedIdentity;
  } else {
    result = {
      resolutionStatus: ResolutionStatusIds.Named,
      chainId: identity.chainId,
      address: identity.address,
      name: primaryNameData.name,
    } satisfies NamedIdentity;
  }

  return {
    ...query,
    identity: result,
  };
}
