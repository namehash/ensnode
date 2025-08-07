import {
  CoinType,
  ResolvePrimaryNameResponse,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
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
app.get("/records/:name", async (c) => {
  try {
    const name = c.req.param("name");
    if (!name) {
      return c.json({ error: "name parameter is required" }, 400);
    }

    // TODO: default selection if none in query
    const selection = buildSelectionFromQueryParams(c);

    const { result: records, trace } = await captureTrace(() => resolveForward(name, selection));

    const showTrace = c.req.query("trace") === "true";

    const response = {
      records,
      ...(showTrace && { trace }),
    } satisfies ResolveRecordsResponse<typeof selection>;

    return c.json(response);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

/**
 * Example queries for /primary-name:
 *
 * 1. ENSIP-19 Primary Name Lookup (for ENS Root Chain Id)
 * GET /primary-name/0x1234...abcd/1
 *
 * 2. ENSIP-19 Multichain Primary Name (for specific Chain, e.g., Optimism)
 * GET /primary-name/0x1234...abcd/10
 */
app.get("/primary-name/:address/:chainId", async (c) => {
  try {
    // TODO: correctly parse/validate with zod
    const address = c.req.param("address") as Address;
    const chainIdParam = c.req.param("chainId");

    if (!address) {
      return c.json({ error: "address parameter is required" }, 400);
    }

    if (!chainIdParam) {
      return c.json({ error: "chainId parameter is required" }, 400);
    }

    const chainId = Number(chainIdParam);
    if (isNaN(chainId)) {
      return c.json({ error: "chainId must be a valid number" }, 400);
    }

    const { result: name, trace } = await captureTrace(() => resolveReverse(address, chainId));

    const showTrace = c.req.query("trace") === "true";

    const response = {
      name,
      ...(showTrace && { trace }),
    } satisfies ResolvePrimaryNameResponse;

    return c.json(response);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
