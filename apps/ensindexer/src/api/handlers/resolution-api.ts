import {
  ChainId,
  CoinType,
  ResolvePrimaryNameResponse,
  ResolveRecordsResponse,
  ResolverRecordsSelection,
} from "@ensnode/ensnode-sdk";
import { Context, Hono } from "hono";
import { Address } from "viem";

import { captureTrace } from "@/api/lib/protocol-tracing";
import { batchResolveReverse } from "@/api/lib/resolution/batch-reverse-resolution";
import { resolveForward } from "@/api/lib/resolution/forward-resolution";
import { resolveReverse } from "@/api/lib/resolution/reverse-resolution";

// TODO: use a zod middleware to parse out the arguments and conform to *ResolutionRequest typings

function getShouldTrace(c: Context) {
  return c.req.query("trace") === "true";
}

function getShouldAccelerate(c: Context) {
  return c.req.query("accelerate") !== "false";
}

// TODO: replace with zod schema or validator
function getSelectionFromQueryParams(c: Context) {
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

// TODO: validate with zod obviously
// disallow DEFAULT_EMV_CHAIN_ID
function getChainIdsFromQueryParams(c: Context): ChainId[] | undefined {
  const chainIdsParam = c.req.query("chainIds");
  let chainIds: ChainId[] | undefined;

  if (chainIdsParam) {
    chainIds = chainIdsParam.split(",").map(Number);
    if (chainIds.some((id) => isNaN(id))) {
      throw new Error("all chainIds must be valid numbers");
    }
  }

  return chainIds;
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
    const selection = getSelectionFromQueryParams(c);
    const showTrace = getShouldTrace(c);
    const accelerate = getShouldAccelerate(c);

    const { result: records, trace } = await captureTrace(() =>
      resolveForward(name, selection, { accelerate }),
    );

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
 *
 * 3. ENSIP-19 Multichain Primary Name (for 'default' EVM Chain)
 * GET /primary-name/0x1234...abcd/0
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

    const showTrace = getShouldTrace(c);
    const accelerate = getShouldAccelerate(c);

    const { result: name, trace } = await captureTrace(() =>
      resolveReverse(address, chainId, { accelerate }),
    );

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

/**
 * Example queries for /primary-names:
 *
 * 1. Batch ENSIP-19 Primary Name Lookup (defaults to all ENSIP-19 supported chains)
 * GET /primary-names/0x1234...abcd
 *
 * 2. Batch ENSIP-19 Primary Name Lookup (specific chain ids)
 * GET /primary-names/0x1234...abcd?chainIds=1,10,8453
 */
app.get("/primary-names/:address", async (c) => {
  try {
    // TODO: correctly parse/validate with zod
    const address = c.req.param("address") as Address;

    if (!address) {
      return c.json({ error: "address parameter is required" }, 400);
    }

    const showTrace = getShouldTrace(c);
    const accelerate = getShouldAccelerate(c);
    const chainIds = getChainIdsFromQueryParams(c);

    const { result: primaryNames, trace } = await captureTrace(() =>
      batchResolveReverse(address, chainIds, { accelerate }),
    );

    const response = {
      primaryNames,
      ...(showTrace && { trace }),
    };

    return c.json(response);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
