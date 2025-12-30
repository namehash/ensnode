import type { Address } from "viem";

import type { Node } from "../../ens";
import type { UnixTimestamp } from "../../shared";
import type { RequestPageParams } from "../shared/pagination";

/**
 * Records Filters: Filter Types
 */
export const RegistrarActionsFilterTypes = {
  BySubregistryNode: "bySubregistryNode",
  WithEncodedReferral: "withEncodedReferral",
  ByDecodedReferrer: "byDecodedReferrer",
  BeginTimestamp: "beginTimestamp",
  EndTimestamp: "endTimestamp",
} as const;

export type RegistrarActionsFilterType =
  (typeof RegistrarActionsFilterTypes)[keyof typeof RegistrarActionsFilterTypes];

export type RegistrarActionsFilterBySubregistryNode = {
  filterType: typeof RegistrarActionsFilterTypes.BySubregistryNode;
  value: Node;
};

export type RegistrarActionsFilterWithEncodedReferral = {
  filterType: typeof RegistrarActionsFilterTypes.WithEncodedReferral;
};

export type RegistrarActionsFilterByDecodedReferrer = {
  filterType: typeof RegistrarActionsFilterTypes.ByDecodedReferrer;
  value: Address;
};

export type RegistrarActionsFilterBeginTimestamp = {
  filterType: typeof RegistrarActionsFilterTypes.BeginTimestamp;
  value: UnixTimestamp;
};

export type RegistrarActionsFilterEndTimestamp = {
  filterType: typeof RegistrarActionsFilterTypes.EndTimestamp;
  value: UnixTimestamp;
};

export type RegistrarActionsFilter =
  | RegistrarActionsFilterBySubregistryNode
  | RegistrarActionsFilterWithEncodedReferral
  | RegistrarActionsFilterByDecodedReferrer
  | RegistrarActionsFilterBeginTimestamp
  | RegistrarActionsFilterEndTimestamp;

/**
 * Records Orders
 */
export const RegistrarActionsOrders = {
  LatestRegistrarActions: "orderBy[timestamp]=desc",
} as const;

export type RegistrarActionsOrder =
  (typeof RegistrarActionsOrders)[keyof typeof RegistrarActionsOrders];

/**
 * Represents a request to Registrar Actions API.
 */
export interface RegistrarActionsRequest extends RequestPageParams {
  /**
   * Filters to be applied while generating results.
   */
  filters?: RegistrarActionsFilter[];

  /**
   * Order applied while generating results.
   */
  order?: RegistrarActionsOrder;
}
