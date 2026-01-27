import z from "zod/v4";

import { makeAbstractResultOkSchema } from "../../shared/result/zod-schemas";
import { makeDurationSchema, makeUnixTimestampSchema } from "../../shared/zod-schemas";
import type { ResultOkAmIRealtime, ResultOkAmIRealtimeData } from "./result";

/**
 * Schema for {@link ResultOkAmIRealtime}.
 */
export const makeResultOkAmIRealtimeSchema = () =>
  makeAbstractResultOkSchema<ResultOkAmIRealtimeData>(
    z.object({
      requestedMaxWorstCaseDistance: makeDurationSchema("requestedMaxWorstCaseDistance"),
      worstCaseDistance: makeDurationSchema("worstCaseDistance"),
      slowestChainIndexingCursor: makeUnixTimestampSchema("slowestChainIndexingCursor"),
      serverNow: makeUnixTimestampSchema("serverNow"),
    }),
  );
