import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../shared/zod-schemas";
import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import {
  makeCrossChainIndexingStatusSnapshotSchema,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "./cross-chain-indexing-status-snapshot";

/**
 * Invariant: For realtime indexing status projection,
 * `projectedAt` is after or same as `snapshot.snapshotTime`.
 */
export function invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime(
  ctx: ParsePayload<RealtimeIndexingStatusProjection>,
) {
  const projection = ctx.value;

  const { snapshot, projectedAt } = projection;

  if (snapshot.snapshotTime > projectedAt) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message: "`projectedAt` must be after or same as `snapshot.snapshotTime`.",
    });
  }
}

/**
 * Invariant: For realtime indexing status projection,
 * `worstCaseDistance` is the difference between `projectedAt`
 * and `snapshot.slowestChainIndexingCursor`.
 */
export function invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect(
  ctx: ParsePayload<RealtimeIndexingStatusProjection>,
) {
  const projection = ctx.value;
  const { projectedAt, snapshot, worstCaseDistance } = projection;
  const expectedWorstCaseDistance = projectedAt - snapshot.slowestChainIndexingCursor;

  if (worstCaseDistance !== expectedWorstCaseDistance) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message:
        "`worstCaseDistance` must be the exact difference between `projectedAt` and `snapshot.slowestChainIndexingCursor`.",
    });
  }
}

/**
 * Makes Zod schema for {@link RealtimeIndexingStatusProjection}
 */
export const makeRealtimeIndexingStatusProjectionSchema = (
  valueLabel: string = "Realtime Indexing Status Projection",
) =>
  z
    .object({
      projectedAt: makeUnixTimestampSchema(valueLabel).describe(
        "The timestamp representing 'now' as of the time this projection was generated.",
      ),
      worstCaseDistance: makeDurationSchema(valueLabel).describe(
        "The distance between `projectedAt` and `snapshot.slowestChainIndexingCursor` in seconds. This is a worst-case distance because it assumes no indexing progress has been made since `snapshot.snapshotTime` and that each indexed chain has added a new block as of `projectedAt`.",
      ),
      snapshot: makeCrossChainIndexingStatusSnapshotSchema(valueLabel).describe(
        "The cross-chain indexing status snapshot that this projection is based on.",
      ),
    })
    .check(invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime)
    .check(invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect);

/**
 * Makes Zod schema for {@link SerializedRealtimeIndexingStatusProjection}.
 */
export const makeSerializedRealtimeIndexingStatusProjectionSchema = (
  valueLabel: string = "Value",
) =>
  z.object({
    snapshot: makeSerializedCrossChainIndexingStatusSnapshotSchema(valueLabel).describe(
      "The cross-chain indexing status snapshot that this projection is based on.",
    ),
    projectedAt: makeUnixTimestampSchema(valueLabel).describe(
      "The timestamp representing 'now' as of the time this projection was generated.",
    ),
    worstCaseDistance: makeDurationSchema(valueLabel).describe(
      "The distance between `projectedAt` and `snapshot.slowestChainIndexingCursor` in seconds. This is a worst-case distance because it assumes no indexing progress has been made since `snapshot.snapshotTime` and that each indexed chain has added a new block as of `projectedAt`.",
    ),
  });
