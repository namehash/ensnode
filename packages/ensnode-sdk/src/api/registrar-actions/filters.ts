import type { Address } from "viem";

import type { Node } from "../../ens";
import type { UnixTimestamp } from "../../shared/types";
import {
  type RegistrarActionsFilter,
  type RegistrarActionsFilterBeginTimestamp,
  type RegistrarActionsFilterByDecodedReferrer,
  type RegistrarActionsFilterEndTimestamp,
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

/**
 * Build a "decoded referrer" filter object for Registrar Actions query.
 */
function byDecodedReferrer(decodedReferrer: Address): RegistrarActionsFilter;
function byDecodedReferrer(decodedReferrer: undefined): undefined;
function byDecodedReferrer(
  decodedReferrer: Address | undefined,
): RegistrarActionsFilter | undefined {
  if (typeof decodedReferrer === "undefined") {
    return undefined;
  }

  return {
    filterType: RegistrarActionsFilterTypes.ByDecodedReferrer,
    value: decodedReferrer,
  } satisfies RegistrarActionsFilterByDecodedReferrer;
}

/**
 * Build a "begin timestamp" filter object for Registrar Actions query.
 *
 * Filters registrar actions to only include those at or after the specified timestamp (inclusive).
 */
function beginTimestamp(timestamp: UnixTimestamp): RegistrarActionsFilter;
function beginTimestamp(timestamp: undefined): undefined;
function beginTimestamp(timestamp: UnixTimestamp | undefined): RegistrarActionsFilter | undefined {
  if (typeof timestamp === "undefined") {
    return undefined;
  }

  return {
    filterType: RegistrarActionsFilterTypes.BeginTimestamp,
    value: timestamp,
  } satisfies RegistrarActionsFilterBeginTimestamp;
}

/**
 * Build an "end timestamp" filter object for Registrar Actions query.
 *
 * Filters registrar actions to only include those at or before the specified timestamp (inclusive).
 */
function endTimestamp(timestamp: UnixTimestamp): RegistrarActionsFilter;
function endTimestamp(timestamp: undefined): undefined;
function endTimestamp(timestamp: UnixTimestamp | undefined): RegistrarActionsFilter | undefined {
  if (typeof timestamp === "undefined") {
    return undefined;
  }

  return {
    filterType: RegistrarActionsFilterTypes.EndTimestamp,
    value: timestamp,
  } satisfies RegistrarActionsFilterEndTimestamp;
}

export const registrarActionsFilter = {
  byParentNode,
  withReferral,
  byDecodedReferrer,
  beginTimestamp,
  endTimestamp,
};
