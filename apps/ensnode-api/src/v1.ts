import { Node } from "@ensnode/utils/types";
import { eq } from "@ponder/client";
import { replaceBigInts } from "@ponder/utils";
import { Hono } from "hono";

import { db, schema } from "./lib/db.js";

const app = new Hono();

app.get("/node/:node", async (c) => {
  const node = c.req.param("node") as Node | undefined;
  if (!node) throw new Error("param expected"); // TODO: correct error handling

  const labels = await db
    .select()
    .from(schema.v2_domain)
    .where(eq(schema.v2_domain.node, node))
    .limit(1);

  if (labels.length === 0) return c.notFound();

  return c.json(replaceBigInts(labels[0], (v) => String(v)));
});

export default app;
