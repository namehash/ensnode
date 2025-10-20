import {
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesResponse,
  ResolveRecordsResponse,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";
import { z } from "zod/v4";

import { errorResponse } from "@/lib/handlers/error-response";
import { validate } from "@/lib/handlers/validate";
import { params, transformSelection } from "@/lib/handlers/zod-schemas";
import { resolveForward } from "@/lib/resolution/forward-resolution";
import { resolvePrimaryNames } from "@/lib/resolution/multichain-primary-name-resolution";
import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { simpleMemoized } from "@/lib/simple-memoized";
import { sdk } from "@/lib/tracing/instrumentation";
import { captureTrace } from "@/lib/tracing/protocol-tracing";

const app = new Hono();

// TODO: derive from indexing status
// const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds
// return realtimeProjection.worstCaseDistance <= MAX_REALTIME_DISTANCE_TO_ACCELERATE;
const canAccelerateResolution = async () => true;

// memoizes the result of canAccelerateResolution within a 30s window
// this means that the effective worstCaseDistance is MAX_REALTIME_DISTANCE_TO_ACCELERATE + 30s
// and the initial request(s) in between ENSApi startup and the first resolution of
// canAccelerateResolution will NOT be accelerated (prefers correctness in responses)
const getCanAccelerateResolution = simpleMemoized(canAccelerateResolution, 30_000, false);

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

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
  validate("param", z.object({ name: params.name })),
  validate(
    "query",
    z
      .object({
        ...params.selection.shape,
        trace: params.trace,
        accelerate: params.accelerate,
      })
      .transform(transformSelection),
  ),
  async (c) => {
    const { name } = c.req.valid("param");
    const { selection, trace: showTrace, accelerate: _accelerate } = c.req.valid("query");
    const accelerate = _accelerate && getCanAccelerateResolution();

    try {
      const { result, trace } = await captureTrace(() =>
        resolveForward(name, selection, { accelerate }),
      );

      const response = {
        records: result,
        accelerationAttempted: accelerate,
        ...(showTrace && { trace }),
      } satisfies ResolveRecordsResponse<typeof selection>;

      return c.json(response);
    } catch (error) {
      console.error(error);
      return errorResponse(c, error);
    }
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
  validate("param", z.object({ address: params.address, chainId: params.defaultableChainId })),
  validate(
    "query",
    z.object({
      trace: params.trace,
      accelerate: params.accelerate,
    }),
  ),
  async (c) => {
    const { address, chainId } = c.req.valid("param");
    const { trace: showTrace, accelerate: _accelerate } = c.req.valid("query");
    const accelerate = _accelerate && getCanAccelerateResolution();

    try {
      const { result, trace } = await captureTrace(() =>
        resolveReverse(address, chainId, { accelerate }),
      );

      const response = {
        name: result,
        accelerationAttempted: accelerate,
        ...(showTrace && { trace }),
      } satisfies ResolvePrimaryNameResponse;

      return c.json(response);
    } catch (error) {
      console.error(error);
      return errorResponse(c, error);
    }
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
    const { address } = c.req.valid("param");
    const { chainIds, trace: showTrace, accelerate: _accelerate } = c.req.valid("query");
    const accelerate = _accelerate && getCanAccelerateResolution();

    try {
      const { result, trace } = await captureTrace(() =>
        resolvePrimaryNames(address, chainIds, { accelerate }),
      );

      const response = {
        names: result,
        accelerationAttempted: accelerate,
        ...(showTrace && { trace }),
      } satisfies ResolvePrimaryNamesResponse;

      return c.json(response);
    } catch (error) {
      console.error(error);
      return errorResponse(c, error);
    }
  },
);

// start ENSNode API OpenTelemetry SDK
sdk.start();

// gracefully shut down the SDK on process interrupt/exit
const shutdownOpenTelemetry = () =>
  sdk.shutdown().catch((error) => console.error("Error terminating tracing", error));
process.on("SIGINT", shutdownOpenTelemetry);
process.on("SIGTERM", shutdownOpenTelemetry);

export default app;
