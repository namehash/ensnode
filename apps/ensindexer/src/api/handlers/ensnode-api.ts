import { resolveForward } from "@/api/lib/forward-resolution";
import { ResolverRecordsSelection } from "@/lib/lib-resolution";
import { Context, Hono } from "hono";

function buildSelectionFromQueryParams(c: Context) {
  const selection: ResolverRecordsSelection = {};
  if (c.req.query("name") === "true") {
    selection.name = true;
  }

  if (c.req.query("addresses")) {
    selection.addresses = c.req.query("addresses")!.split(",").map(BigInt) ?? [];
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
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

export default app;
