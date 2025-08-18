import {
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesResponse,
  ResolveRecordsResponse,
} from "@ensnode/ensnode-sdk";
import { Hono } from "hono";

import { errorResponse } from "@/api/lib/error-response";
import { captureTrace } from "@/api/lib/protocol-tracing";
import { resolveForward } from "@/api/lib/resolution/forward-resolution";
import { resolvePrimaryNames } from "@/api/lib/resolution/multichain-primary-name-resolution";
import { resolveReverse } from "@/api/lib/resolution/reverse-resolution";
import { validate } from "@/api/lib/validate";
import { routes } from "@ensnode/ensnode-sdk/internal";

const app = new Hono();

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
    const { selection, trace: showTrace, accelerate } = c.req.valid("query");

    try {
      const { result, trace } = await captureTrace(() =>
        resolveForward(name, selection, { accelerate }),
      );

      const response = {
        records: result,
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
    const { trace: showTrace, accelerate } = c.req.valid("query");

    try {
      const { result, trace } = await captureTrace(() =>
        resolveReverse(address, chainId, { accelerate }),
      );

      const response = {
        name: result,
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
    const { chainIds, trace: showTrace, accelerate } = c.req.valid("query");

    try {
      const { result, trace } = await captureTrace(() =>
        resolvePrimaryNames(address, chainIds, { accelerate }),
      );

      const response = {
        names: result,
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
