import {
  CoinType,
  ForwardResolutionResponse,
  ResolverRecordsSelection,
  ReverseResolutionResponse,
} from "@ensnode/ensnode-sdk";
import { Context, Hono } from "hono";
import { Address } from "viem";

import { resolveForward } from "@/api/lib/forward-resolution";
import { captureTrace } from "@/api/lib/protocol-tracing";
import { resolveReverse } from "@/api/lib/reverse-resolution";

// TODO: use a zod middleware to parse out the arguments and conform to *ResolutionRequest typings

// TODO: replace with zod schema or validator
function buildSelectionFromQueryParams(c: Context) {
  const selection: Partial<ResolverRecordsSelection> = {};

  if (c.req.query("name") === "true") {
    selection.name = true;
  }

  if (c.req.query("addresses")) {
    selection.addresses = (c.req.query("addresses")!.split(",").map(Number) as CoinType[]) ?? [];
  }

  if (c.req.query("texts")) {
    selection.texts = c.req.query("texts")?.split(",") ?? [];
  }

  return selection;
}

const app = new Hono();

/**
 * Example queries for /forward:
 *
 * 1. Resolve address records (ETH and BTC):
 * GET /resolve/example.eth&addresses=60,0
 *
 * 2. Resolve text records (avatar and Twitter):
 * GET /resolve/example.eth&texts=avatar,com.twitter
 *
 * 3. Combined resolution:
 * GET /resolve/example.eth&name=true&addresses=60,0&texts=avatar,com.twitter
 */
app.get("/forward/:name", async (c) => {
  try {
    const name = c.req.param("name");
    if (!name) {
      return c.json({ error: "name parameter is required" }, 400);
    }

    // TODO: default selection if none in query
    const selection = buildSelectionFromQueryParams(c);

    const { result: records, trace } = await captureTrace(() => resolveForward(name, selection));

    const showTrace = !!c.req.param("trace");
    return c.json({ records, ...(showTrace && { trace }) } as ForwardResolutionResponse<
      typeof selection
    >);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

/**
 * Example queries for /reverse:
 *
 * 1. ENSIP-19 Primary Name Lookup (for ENS Root Chain coinType, or default)
 * GET /reverse/0x1234...abcd
 *
 * 2. ENSIP-19 Multichain Primary Name (for specific Chain (e.g., Optimism), or default)
 * GET /reverse/0x1234...abcd?chainId=10
 */
app.get("/reverse/:address", async (c) => {
  try {
    // TODO: correctly parse/validate with zod
    const address = c.req.param("address") as Address;
    if (!address) {
      return c.json({ error: "address parameter is required" }, 400);
    }

    // TODO: _require_ chain Id ?
    const chainId = c.req.query("chainId") ? Number(c.req.query("chainId")) : 1;

    const { result: records, trace } = await captureTrace(() => resolveReverse(address, chainId));

    const showTrace = !!c.req.query("trace");
    return c.json({ records, ...(showTrace && { trace }) } as ReverseResolutionResponse);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
