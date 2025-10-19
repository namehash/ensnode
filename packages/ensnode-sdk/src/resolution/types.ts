import { Address } from "viem";

import type { Name } from "../ens";
import { ChainId, DefaultableChainId } from "../shared";
import { ResolverRecordsResponse } from "./resolver-records-response";
import type { ResolverRecordsSelection } from "./resolver-records-selection";

/**
 * Arguments required to perform Forward Resolution
 */
export interface ForwardResolutionArgs<SELECTION extends ResolverRecordsSelection> {
  name: Name;
  selection: SELECTION;
}

/**
 * The result of performing ForwardResolution
 */
export type ForwardResolutionResult<SELECTION extends ResolverRecordsSelection> =
  ResolverRecordsResponse<SELECTION>;

/**
 * Arguments required to perform Reverse Resolution
 */
export interface ReverseResolutionArgs {
  address: Address;
  chainId: ChainId;
}

/**
 * The result of performing ReverseResolution
 */
export type ReverseResolutionResult = Name | null;

/**
 * Arguments required to perform Multichain Primary Name Resolution
 */
export interface MultichainPrimaryNameResolutionArgs {
  address: Address;
  chainIds?: ChainId[];
}

/**
 * The result of performing MultichainPrimaryNameResolution
 */
export type MultichainPrimaryNameResolutionResult = Record<ChainId, Name | null>;

/**
 * The resolution status for an `Identity`.
 */
export const ResolutionStatusIds = {
  /**
   * Represents that the `Identity` is not resolved yet.
   */
  Unresolved: "unresolved",

  /**
   * Represents that resolution of the `Identity` resulted in a named identity.
   */
  Named: "named",

  /**
   * Represents that resolution of the `Identity` resulted in an unnamed identity.
   */
  Unnamed: "unnamed",

  /**
   * Represents that attempted resolution of the `Identity` resulted in an error
   * and therefore it is unknown if the `Identity` resolves to a named or unnamed identity.
   */
  Unknown: "unknown",
} as const;

/**
 * The derived string union of possible {@link ResolutionStatusIds}.
 */
export type ResolutionStatusId = (typeof ResolutionStatusIds)[keyof typeof ResolutionStatusIds];

/**
 * Represents an {@link Identity} that has not become a {@link ResolvedIdentity} yet.
 *
 * Invariants:
 * - `resolutionStatus` is always {@link ResolutionStatusIds.Unresolved}.
 */
export interface UnresolvedIdentity {
  resolutionStatus: typeof ResolutionStatusIds.Unresolved;

  /**
   * The {@link DefaultableChainId} for an ENSIP-19 primary name lookup of the
   * identity associated with `address`.
   */
  chainId: DefaultableChainId;

  /**
   * The {@link Address} of the identity.
   */
  address: Address;
}

/**
 * Represents an `Identity` that resolved to a primary name.
 *
 * Invariants:
 * - `resolutionStatus` is always {@link ResolutionStatusIds.Named}.
 */
export interface NamedIdentity {
  resolutionStatus: typeof ResolutionStatusIds.Named;

  /**
   * The {@link DefaultableChainId} for an ENSIP-19 primary name lookup of the
   * identity associated with `address`.
   */
  chainId: DefaultableChainId;

  /**
   * The address of the identity.
   */
  address: Address;

  /**
   * The ENSIP-19 primary name lookup result of `address` on `chainId`.
   */
  name: Name;
}

/**
 * Represents an `Identity` that did not resolve to a primary name.
 *
 * Invariants:
 * - `resolutionStatus` is always {@link ResolutionStatusIds.Unnamed}.
 * - `name` is always `null`.
 */
export interface UnnamedIdentity {
  resolutionStatus: typeof ResolutionStatusIds.Unnamed;

  /**
   * The {@link DefaultableChainId} for an ENSIP-19 primary name lookup of the
   * identity associated with `address`.
   */
  chainId: DefaultableChainId;

  /**
   * The address of the identity.
   */
  address: Address;

  /**
   * The ENSIP-19 primary name lookup result of `address` on `chainId`.
   */
  name: null;
}

/**
 * Represents an `Identity` that was attempted to be resolved but the resolution attempt
 * resulted in an error and therefore it is unknown if the `Identity` resolves to a named
 * or unnamed identity.
 *
 * Invariants:
 * - `resolutionStatus` is always {@link ResolutionStatusIds.Unknown}.
 */
export interface UnknownIdentity {
  resolutionStatus: typeof ResolutionStatusIds.Unknown;

  /**
   * The {@link DefaultableChainId} for an ENSIP-19 primary name lookup of the
   * identity associated with `address`.
   */
  chainId: DefaultableChainId;

  /**
   * The address of the identity.
   */
  address: Address;
}

/**
 * Represents an ENSIP-19 identity resolution result.
 *
 * Use the `resolutionStatus` field to determine the specific type interpretation
 * at runtime.
 */
export type ResolvedIdentity = NamedIdentity | UnnamedIdentity | UnknownIdentity;

/**
 * Represents an ENSIP-19 identity resolution (which may or not have been
 * resolved to a result yet).
 *
 * Use the `resolutionStatus` field to determine the specific type interpretation
 * at runtime.
 */
export type Identity = UnresolvedIdentity | ResolvedIdentity;
