import type { Node } from "../../ens";

/**
 * Records Filters: Filter Types
 */
export const RegistrarActionsFilterTypes = {
  BySubregistryNode: "bySubregistryNode",
  WithEncodedReferral: "withEncodedReferral",
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

export type RegistrarActionsFilter =
  | RegistrarActionsFilterBySubregistryNode
  | RegistrarActionsFilterWithEncodedReferral;

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
export type RegistrarActionsRequest = {
  /**
   * Filters to be applied while generating results.
   */
  filters?: RegistrarActionsFilter[];

  /**
   * Order applied while generating results.
   */
  order?: RegistrarActionsOrder;

  /**
   * Limit the count of items per page to selected count of records.
   *
   * Guaranteed to be a positive integer (if defined).
   */
  itemsPerPage?: number;
};
