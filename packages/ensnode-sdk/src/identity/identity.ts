import type { Address } from "viem";

import { type ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";

import type { DefaultableChainId } from "../shared";
import {
  type Identity,
  ResolutionStatusIds,
  type ResolvedIdentity,
  type UnresolvedIdentity,
} from "./types";

/**
 * Builds an {@link UnresolvedIdentity} for the provided {@link Address},
 * {@link DefaultableChainId} and {@link ENSNamespaceId}.
 *
 * If no `chainId` is provided, uses the ENS Root Chain Id for the provided
 * `namespaceId`.
 */
export function buildUnresolvedIdentity(
  address: Address,
  namespaceId: ENSNamespaceId,
  chainId?: DefaultableChainId,
): UnresolvedIdentity {
  return {
    resolutionStatus: ResolutionStatusIds.Unresolved,
    chainId: chainId ?? getENSRootChainId(namespaceId),
    address,
  };
}

/**
 * Returns whether the provided {@link Identity} is a {@link ResolvedIdentity}.
 *
 * @param identity - The {@link Identity} to check.
 * @returns Whether the provided {@link Identity} is a {@link ResolvedIdentity}.
 */
export function isResolvedIdentity(identity: Identity): identity is ResolvedIdentity {
  return identity.resolutionStatus !== ResolutionStatusIds.Unresolved;
}
