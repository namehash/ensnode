import type { Address } from "viem";

import type { Node } from "../../ens";
import type { RequestPageParams } from "../shared/pagination";

/**
 * Records Filters: Filter Types
 */
export const RegistrarActionsFilterTypes = {
  BySubregistryNode: "bySubregistryNode",
  WithEncodedReferral: "withEncodedReferral",
  ByDecodedReferrer: "byDecodedReferrer",
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

export type RegistrarActionsFilter =
  | RegistrarActionsFilterBySubregistryNode
  | RegistrarActionsFilterWithEncodedReferral
  | RegistrarActionsFilterByDecodedReferrer;

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
