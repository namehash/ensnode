import z, { prettifyError } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import { makeCrossChainIndexingStatusSnapshotSchema } from "./cross-chain-indexing-status-snapshot";

/**
 * Validate a {@link RealtimeIndexingStatusProjection} object.
 */
export function validateRealtimeIndexingStatusProjection(
  unvalidatedProjection: RealtimeIndexingStatusProjection,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeRealtimeIndexingStatusProjectionSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedProjection);
  if (parsed.error) {
    throw new Error(`Invalid RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

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
 * and `omnichainIndexingCursor`.
 */
export function invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect(
  ctx: ParsePayload<RealtimeIndexingStatusProjection>,
) {
  const projection = ctx.value;
  const { projectedAt, snapshot, worstCaseDistance } = projection;
  const { omnichainSnapshot } = snapshot;
  const expectedWorstCaseDistance = projectedAt - omnichainSnapshot.omnichainIndexingCursor;

  if (worstCaseDistance !== expectedWorstCaseDistance) {
    ctx.issues.push({
      code: "custom",
      input: projection,
      message:
        "`worstCaseDistance` must be the exact difference between `projectedAt` and `snapshot.omnichainIndexingCursor`.",
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
    .strictObject({
      projectedAt: makeUnixTimestampSchema(valueLabel),
      worstCaseDistance: makeDurationSchema(valueLabel),
      snapshot: makeCrossChainIndexingStatusSnapshotSchema(valueLabel),
    })
    .check(invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime)
    .check(invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect);
