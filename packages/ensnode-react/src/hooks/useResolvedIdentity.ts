"use client";

import {
  type ENSNamespaceId,
  ENSNamespaceIds,
  getResolvePrimaryNameChainIdParam,
  type Identity,
  type NamedIdentity,
  ResolutionStatusIds,
  ResolvedIdentity,
  type UnknownIdentity,
  type UnnamedIdentity,
  type UnresolvedIdentity,
} from "@ensnode/ensnode-sdk";

import type { UseResolvedIdentityParameters } from "../types";
import { usePrimaryName } from "./usePrimaryName";

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
 * @param parameters.accelerate - Whether to attempt Protocol Acceleration (default: false)
 *                                when resolving the primary name.
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
  const { identity, namespace, accelerate, query: _query = {} } = parameters;

  const {
    data: primaryNameData,
    status,
    ...query
  } = usePrimaryName({
    address: identity.address,
    chainId: getResolvePrimaryNameChainIdParam(
      identity.chainId,
      // NOTE: defaulting here for typechecking, but enabled prevents fetching before namespace is known
      namespace ?? ENSNamespaceIds.Mainnet,
    ),
    accelerate,
    query: {
      ..._query,
      enabled: (_query.enabled ?? true) && namespace !== undefined,
    },
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
