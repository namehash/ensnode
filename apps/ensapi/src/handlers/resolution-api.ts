import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod/v4";

import {
  type Duration,
  makeResolvePrimaryNameResponseSchema,
  makeResolvePrimaryNamesResponseSchema,
  makeResolveRecordsResponseSchema,
  type ResolvePrimaryNameResponse,
  type ResolvePrimaryNamesResponse,
  type ResolveRecordsResponse,
} from "@ensnode/ensnode-sdk";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { resolveForward } from "@/lib/resolution/forward-resolution";
import { resolvePrimaryNames } from "@/lib/resolution/multichain-primary-name-resolution";
import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { runWithTrace } from "@/lib/tracing/tracing-api";
import { canAccelerateMiddleware } from "@/middleware/can-accelerate.middleware";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";

/**
 * The effective distance for acceleration is indexing status cache time plus
 * MAX_REALTIME_DISTANCE_TO_ACCELERATE.
 */
const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // 1 minute in seconds

const app = factory.createApp();

// inject c.var.isRealtime derived from MAX_REALTIME_DISTANCE_TO_ACCELERATE
app.use(makeIsRealtimeMiddleware("resolution-api", MAX_REALTIME_DISTANCE_TO_ACCELERATE));
// inject c.var.canAccelerate derived from that c.var.isRealtime
app.use(canAccelerateMiddleware);

/**
 * Example queries for /records:
 *
 * 1. Resolve address records (ETH and BTC):
 * GET /records/example.eth&addresses=60,0
 *
 * 2. Resolve text records (avatar and Twitter):
 * GET /records/example.eth&texts=avatar,com.twitter
 *
 * 3. Combined resolution:
 * GET /records/example.eth&name=true&addresses=60,0&texts=avatar,com.twitter
 */
app.get(
  "/records/:name",
  describeRoute({
    summary: "Resolve ENS Records",
    description: "Resolves ENS records for a given name",
    responses: {
      200: {
        description: "Successfully resolved records",
        content: {
          "application/json": {
            schema: resolver(makeResolveRecordsResponseSchema()),
          },
        },
      },
    },
  }),
  validate("param", z.object({ name: params.name })),
  validate(
    "query",
    z
      .object({
        ...params.selectionParams.shape,
        trace: params.trace,
        accelerate: params.accelerate,
      })
      .transform((value) => {
        const { trace, accelerate, ...selectionParams } = value;
        const selection = params.selection.parse(selectionParams);
        return { selection, trace, accelerate };
      }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.canAccelerate === undefined) {
      throw new Error(`Invariant(resolution-api): canAccelerateMiddleware required`);
    }

    const { name } = c.req.valid("param");
    const { selection, trace: showTrace, accelerate } = c.req.valid("query");
    const canAccelerate = c.var.canAccelerate;

    const { result, trace } = await runWithTrace(() =>
      resolveForward(name, selection, { accelerate, canAccelerate }),
    );

    const response = {
      records: result,

      accelerationRequested: accelerate,
      accelerationAttempted: accelerate && canAccelerate,
      ...(showTrace && { trace }),
    } satisfies ResolveRecordsResponse<typeof selection>;

    return c.json(response);
  },
);

/**
 * Example queries for /primary-name:
 *
 * 1. ENSIP-19 Primary Name Lookup (for ETH Mainnet)
 * GET /primary-name/0x1234...abcd/1
 *
 * 2. ENSIP-19 Primary Name (for specific Chain, e.g., Optimism)
 * GET /primary-name/0x1234...abcd/10
 *
 * 3. ENSIP-19 Primary Name (for 'default' EVM Chain)
 * GET /primary-name/0x1234...abcd/0
 */
app.get(
  "/primary-name/:address/:chainId",
  describeRoute({
    summary: "Resolve Primary Name",
    description: "Resolves a primary name for a given `address` and `chainId`",
    responses: {
      200: {
        description: "Successfully resolved name",
        content: {
          "application/json": {
            schema: resolver(makeResolvePrimaryNameResponseSchema()),
          },
        },
      },
    },
  }),
  validate("param", z.object({ address: params.address, chainId: params.defaultableChainId })),
  validate(
    "query",
    z.object({
      trace: params.trace,
      accelerate: params.accelerate,
    }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.canAccelerate === undefined) {
      throw new Error(`Invariant(resolution-api): canAccelerateMiddleware required`);
    }

    const { address, chainId } = c.req.valid("param");
    const { trace: showTrace, accelerate } = c.req.valid("query");
    const canAccelerate = c.var.canAccelerate;

    const { result, trace } = await runWithTrace(() =>
      resolveReverse(address, chainId, { accelerate, canAccelerate }),
    );

    const response = {
      name: result,

      accelerationRequested: accelerate,
      accelerationAttempted: accelerate && canAccelerate,
      ...(showTrace && { trace }),
    } satisfies ResolvePrimaryNameResponse;

    return c.json(response);
  },
);

/**
 * Example queries for /primary-names:
 *
 * 1. Multichain ENSIP-19 Primary Names Lookup (defaults to all ENSIP-19 supported chains)
 * GET /primary-names/0x1234...abcd
 *
 * 2. Multichain ENSIP-19 Primary Names Lookup (specific chain ids)
 * GET /primary-names/0x1234...abcd?chainIds=1,10,8453
 */
app.get(
  "/primary-names/:address",
  describeRoute({
    summary: "Resolve Primary Names",
    description: "Resolves all primary names for a given address across multiple chains",
    responses: {
      200: {
        description: "Successfully resolved records",
        content: {
          "application/json": {
            schema: resolver(makeResolvePrimaryNamesResponseSchema()),
          },
        },
      },
    },
  }),
  validate("param", z.object({ address: params.address })),
  validate(
    "query",
    z.object({
      chainIds: params.chainIdsWithoutDefaultChainId,
      trace: params.trace,
      accelerate: params.accelerate,
    }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.canAccelerate === undefined) {
      throw new Error(`Invariant(resolution-api): canAccelerateMiddleware required`);
    }

    const { address } = c.req.valid("param");
    const { chainIds, trace: showTrace, accelerate } = c.req.valid("query");
    const canAccelerate = c.var.canAccelerate;

    const { result, trace } = await runWithTrace(() =>
      resolvePrimaryNames(address, chainIds, { accelerate, canAccelerate }),
    );

    const response = {
      names: result,

      accelerationRequested: accelerate,
      accelerationAttempted: accelerate && canAccelerate,
      ...(showTrace && { trace }),
    } satisfies ResolvePrimaryNamesResponse;

    return c.json(response);
  },
);

export default app;
