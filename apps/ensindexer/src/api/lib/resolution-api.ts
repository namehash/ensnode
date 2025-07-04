import { resolveForward } from "@/api/lib/forward-resolution";
import { resolveReverse } from "@/api/lib/reverse-resolution";
import { resolveUniversal } from "@/api/lib/universal-resolution";
import { ResolverRecordsSelection } from "@/lib/lib-resolution";
import { CoinType, Name } from "@ensnode/ensnode-sdk";
import { Context, Hono } from "hono";
import { Address } from "viem";

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

    const result = await resolveForward(name, selection);
    return c.json(result);
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

    const result = await resolveReverse(address, chainId);
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

/**
 * Example queries for /universal:
 *
 * 1. Universal resolution for an address:
 * GET /universal/0x1234...abcd?name=true&addresses=60&texts=avatar
 *
 * 2. Universal resolution for a name:
 * GET /universal/example.eth?name=true&addresses=60,0&texts=avatar,com.twitter
 */

app.get("/universal/:addressOrName", async (c) => {
  try {
    // TODO: correctly parse/validate with zod
    const addressOrName = c.req.param("addressOrName") as Address | Name;
    if (!addressOrName) {
      return c.json({ error: "addressOrName parameter is required" }, 400);
    }

    const selection = buildSelectionFromQueryParams(c);

    const result = await resolveUniversal(addressOrName, selection);
    return c.json(result);
  } catch (error) {
    console.error(error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
