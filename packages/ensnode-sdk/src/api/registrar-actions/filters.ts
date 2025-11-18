import type { Node } from "../../ens";
import { type RegistrarActionsFilter, RegistrarActionsFilterFields } from "..";

export const registrarActionsFilter = {
  /**
   * Build a "parent node" filter object for Registrar Actions query.
   */
  byParentNode(parentNode: Node | undefined): RegistrarActionsFilter | undefined {
    if (typeof parentNode === "undefined") {
      return undefined;
    }

    return {
      field: RegistrarActionsFilterFields.SubregistryNode,
      comparator: "eq",
      value: parentNode,
    };
  },
};
