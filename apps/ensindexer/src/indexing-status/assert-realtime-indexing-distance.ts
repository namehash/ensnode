/**
 * Assert Realtime Indexing Distance
 *
 * This file includes ideas and functionality checking the realtime indexing distance.
 */

import { ENSIndexerOverallIndexingStatus, OverallIndexingStatusIds } from "@ensnode/ensnode-sdk";
import { makeNonNegativeIntegerSchema } from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";

/**
 * Coerce number from a non-empty string.
 *
 * Zod's `z.coerce.number()` turns empty string into `0`. We need to have
 * empty strings turned into validation error.
 */
const coerceNumberFromNonEmptyString = (labelValue: string = "Value") =>
  z.preprocess((value) => {
    if (typeof value === "string") {
      if (value.trim() === "") {
        throw new Error(`${labelValue} must represent an integer.`);
      }

      const intValue = Number.parseInt(value);

      if (intValue.toString() !== value) {
        throw new Error(`${labelValue} must represent an integer.`);
      }

      return intValue;
    }

    return value;
  }, z.int());

const makeMaxRealtimeDistanceQueryParamSchema = (labelValue: string = "Value") =>
  coerceNumberFromNonEmptyString(labelValue).pipe(makeNonNegativeIntegerSchema(labelValue));

const errors = {
  badInput(message: string) {
    return new RangeError(message);
  },
  overallStatusNotFollowing() {
    return new Error("Overall indexing status must be 'following'.");
  },
  hasNotAchievedRequestedRealtimeIndexingDistance() {
    return new Error("Requested realtime indexing distance has not been achieved yet.");
  },
};

/**
 * Assert if the requested max realtime indexing distance was achieved.
 * If that's the case, no error is thrown.
 *
 * @throws error for invalid input.
 * @throws error if overall status was not 'following'.
 * @throws error if realtime indexing distance was not achieved.
 */
export function assertRealtimeIndexingDistance(
  indexingStatus: ENSIndexerOverallIndexingStatus,
  maxRealtimeDistanceQueryParam: string,
): void {
  const schema = makeMaxRealtimeDistanceQueryParamSchema("maxRealtimeDistance");

  // try parsing the optional "maxRealtimeDistance" query param
  const maxRealtimeDistanceParsed = schema.safeParse(maxRealtimeDistanceQueryParam);

  // throw range error if provided value was not in expected range of values
  if (typeof maxRealtimeDistanceParsed.data === "undefined") {
    throw errors.badInput(
      `Could not parse "maxRealtimeDistance" query param. If provided, it must represent a non-negative integer.`,
    );
  }

  const requestedRealtimeIndexingDistance = maxRealtimeDistanceParsed.data;

  // throw error if the overall indexing status is other than 'following'
  if (indexingStatus.overallStatus !== OverallIndexingStatusIds.Following) {
    throw errors.overallStatusNotFollowing();
  }

  const hasNotAchievedRequestedRealtimeIndexingDistance =
    indexingStatus.maxApproximateRealtimeDistance > requestedRealtimeIndexingDistance;

  // throw error if the requested realtime indexing distance
  // has not been achieved yet
  if (hasNotAchievedRequestedRealtimeIndexingDistance) {
    throw errors.hasNotAchievedRequestedRealtimeIndexingDistance();
  }
}
