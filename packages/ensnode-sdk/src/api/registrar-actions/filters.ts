import type { Node } from "../../ens";
import {
  type RegistrarActionsFilter,
  RegistrarActionsFilterTypes,
  type RegistrarActionsFilterWithEncodedReferral,
} from "./request";

/**
 * Build a "parent node" filter object for Registrar Actions query.
 */
function byParentNode(parentNode: Node): RegistrarActionsFilter;
function byParentNode(parentNode: undefined): undefined;
function byParentNode(parentNode: Node | undefined): RegistrarActionsFilter | undefined {
  if (typeof parentNode === "undefined") {
    return undefined;
  }

  return {
    filterType: RegistrarActionsFilterTypes.BySubregistryNode,
    value: parentNode,
  };
}

/**
 * Build a "with referral" filter object for Registrar Actions query.
 */
function withReferral(withReferral: true): RegistrarActionsFilter;
function withReferral(withReferral: false | undefined): undefined;
function withReferral(withReferral: boolean | undefined): RegistrarActionsFilter | undefined {
  if (!withReferral) {
    return undefined;
  }

  return {
    filterType: RegistrarActionsFilterTypes.WithEncodedReferral,
  } satisfies RegistrarActionsFilterWithEncodedReferral;
}

export const registrarActionsFilter = {
  byParentNode,
  withReferral,
};
