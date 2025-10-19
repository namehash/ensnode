import {
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesResponse,
  ResolveRecordsResponse,
} from "@ensnode/ensnode-sdk";
import { Hono } from "hono";

import { resolveForward } from "@/lib/resolution/forward-resolution";
import { resolvePrimaryNames } from "@/lib/resolution/multichain-primary-name-resolution";
import { resolveReverse } from "@/lib/resolution/reverse-resolution";
import { simpleMemoized } from "@/lib/simple-memoized";
import { captureTrace } from "@/lib/tracing/protocol-tracing";
import { errorResponse, routes, validate } from "@ensnode/ensnode-sdk/internal";

const app = new Hono();

// TODO: replace with indexing status request with maxRealtimeDistance set (?) or re-derive from
// cached indexing status
const canAccelerateResolution = async () => true;

// memoizes the result of canAccelerateResolution within a 30s window
// this means that the effective maxRealtimeDistance is MAX_REALTIME_DISTANCE_TO_ACCELERATE + 30s
// and the initial request(s) in between ENSApi startup and the first resolution of
// canAccelerateResolution will NOT be accelerated (prefers correctness in responses)
const getCanAccelerateResolution = simpleMemoized(canAccelerateResolution, 30_000, false);

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
  validate("param", routes.records.params),
  validate("query", routes.records.query),
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
  validate("param", routes.primaryName.params),
  validate("query", routes.primaryName.query),
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
  validate("param", routes.primaryNames.params),
  validate("query", routes.primaryNames.query),
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

export default app;
