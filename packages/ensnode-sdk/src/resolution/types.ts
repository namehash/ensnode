import { Address } from "viem";

import type { Name } from "../ens";
import { ChainId } from "../shared";
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
 * Arguments required to perform Batch Reverse Resolution
 */
export interface BatchReverseResolutionArgs {
  address: Address;
  chainIds?: ChainId[];
}

/**
 * The result of performing BatchReverseResolution
 */
export type BatchReverseResolutionResult = Record<ChainId, Name | null>;
