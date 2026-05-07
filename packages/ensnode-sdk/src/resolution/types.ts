import type { Address, ChainId, Name } from "enssdk";

import type { ResolverRecordsResponse } from "./resolver-records-response";
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
