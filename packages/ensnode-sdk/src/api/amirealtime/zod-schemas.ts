import z from "zod/v4";

import { buildAbstractResultOkSchema } from "../../shared/result/zod-schemas";
import { makeDurationSchema, makeUnixTimestampSchema } from "../../shared/zod-schemas";
import type { AmIRealtimeResultOk, AmIRealtimeResultOkData } from "./result";

/**
 * Schema for {@link AmIRealtimeResultOk}.
 */
export const amIRealtimeResultOkSchema = buildAbstractResultOkSchema<AmIRealtimeResultOkData>(
  z.object({
    maxWorstCaseDistance: makeDurationSchema("maxWorstCaseDistance"),
    worstCaseDistance: makeDurationSchema("worstCaseDistance"),
    slowestChainIndexingCursor: makeUnixTimestampSchema("slowestChainIndexingCursor"),
  }),
);
