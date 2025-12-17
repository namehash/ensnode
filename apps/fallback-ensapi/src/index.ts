import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

app.get("/health", async (c) => c.json({ ok: true }));

export const handler = handle(app);
