/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import { z } from "zod/v4";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import {
  invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime,
  invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect,
} from "../validations";
import { makeCrossChainIndexingStatusSnapshotSchema } from "./cross-chain-indexing-status-snapshot";

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
