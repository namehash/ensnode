import { CoinType, Name } from "@ensnode/ensnode-sdk";
import { Context, Hono } from "hono";
import { Address } from "viem";

import { resolveAutomatic } from "@/api/lib/automatic-resolution";
import { resolveForward } from "@/api/lib/forward-resolution";
import { captureTrace } from "@/api/lib/protocol-tracing";
import { ResolverRecordsSelection } from "@/api/lib/resolver-records-selection";
import { resolveReverse } from "@/api/lib/reverse-resolution";

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

    const selection = buildSelectionFromQueryParams(c);

    const { result: records, trace } = await captureTrace(() => resolveForward(name, selection));

    const debug = !!c.req.param("debug");
    return c.json({ records, ...(debug && { trace }) });
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

    const chainId = c.req.query("chainId") ? Number(c.req.query("chainId")) : 1;

    const { result: records, trace } = await captureTrace(() => resolveReverse(address, chainId));

    const debug = !!c.req.query("debug");
    return c.json({ records, ...(debug && { trace }) });
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

/**
 * Example queries for /auto:
 *
 * 1. Auto resolution for an address:
 * GET /auto/0x1234...abcd?name=true&addresses=60&texts=avatar
 *
 * 2. Auto resolution for a name:
 * GET /auto/example.eth?name=true&addresses=60,0&texts=avatar,com.twitter
 */

app.get("/auto/:addressOrName", async (c) => {
  try {
    // TODO: correctly parse/validate with zod
    const addressOrName = c.req.query("addressOrName") as Address | Name;
    if (!addressOrName) {
      return c.json({ error: "addressOrName parameter is required" }, 400);
    }

    const selection = buildSelectionFromQueryParams(c);

    const { result: records, trace } = await captureTrace(() =>
      resolveAutomatic(addressOrName, selection),
    );

    const debug = !!c.req.query("debug");
    return c.json({ records, ...(debug && { trace }) });
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
