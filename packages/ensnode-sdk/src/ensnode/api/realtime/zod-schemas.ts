import { z } from "zod/v4";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import { makeErrorResponseSchema } from "../shared/errors/zod-schemas";

export const realtimeResponseSchemaOk = z.object({
  maxWorstCaseDistance: makeDurationSchema().describe(
    "The requested maximum acceptable worst-case indexing distance in seconds.",
  ),
  slowestChainIndexingCursor: makeUnixTimestampSchema().describe(
    "The timestamp of the slowest chain's latest indexed block.",
  ),
  worstCaseDistance: makeDurationSchema().describe(
    "The actual worst-case distance in seconds between 'now' and the slowest chain's indexing cursor. " +
      "This allows your client to programmatically determine whether the ENSNode instance is sufficiently synchronized for your use case.",
  ),
});

export const realtimeResponseSchemaError = makeErrorResponseSchema();
