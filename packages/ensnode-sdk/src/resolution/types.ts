import { Address } from "viem";

import type { Name } from "../ens";
import type { ResolverRecordsSelection } from "./resolver-records-selection";

/**
 * Arguments required to perform Forward Resolution
 */
export interface ForwardResolutionArgs<SELECTION extends ResolverRecordsSelection> {
  name: Name;
  selection: SELECTION;
}

/**
 * Arguments required to perform Reverse Resolution
 */
export interface ReverseResolutionArgs {
  address: Address;
  chainId: number;
}
