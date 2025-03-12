import { replaceBigInts } from "@ponder/utils";
import { Hono } from "hono";

import { getDomain } from "./lib/get-domain.js";

const app = new Hono();

/**
 * Finds a Domain by its `name` in the nametree.
 */
app.get("/domain/:name", async (c) => {
  const name = c.req.param("name");

  const domainTree = await getDomain(name);

  return c.json(replaceBigInts(domainTree, (v) => String(v)));
});

export default app;
