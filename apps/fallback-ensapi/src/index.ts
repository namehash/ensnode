import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { html } from "hono/html";
import { proxy } from "hono/proxy";

import {
  canFallbackToTheGraph,
  isConfigTemplateSubgraphCompatible,
  namespaceForConfigTemplateId,
} from "@ensnode/ensnode-sdk/internal";

import { parseHostHeader } from "@/lib/parse-host-header";

const THEGRAPH_API_KEY = process.env.THEGRAPH_API_KEY;

const app = new Hono();

// host welcome page
app.get("/", (c) =>
  c.html(html`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ENSApi</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>You've reached the root of the ENSApi Fallback. You might be looking for ENSNode's <a href="https://ensnode.io/docs/">documentation</a>.</p>
</body>
</html>
`),
);

app.get("/health", async (c) => {
  if (!THEGRAPH_API_KEY) return c.json({ message: "THEGRAPH_API_KEY not configured" }, 500);
  return c.json({ message: "ok" });
});

app.all("/subgraph", async (c) => {
  const header = c.req.header("Host");
  if (!header) return c.json({ message: "Missing Host Header" }, 400);

  const configTemplateId = parseHostHeader(header);
  if (!configTemplateId) return c.json({ message: "Unable to parse Host Header" }, 400);

  const namespace = namespaceForConfigTemplateId(configTemplateId);

  const fallback = canFallbackToTheGraph({
    namespace,
    isSubgraphCompatible: isConfigTemplateSubgraphCompatible(configTemplateId),
    theGraphApiKey: process.env.THEGRAPH_API_KEY,
  });

  if (!fallback.canFallback) return c.json({ message: "Service Unavailable" }, 503);

  // https://hono.dev/docs/helpers/proxy
  return proxy(fallback.url, {
    // provide existing method/body
    method: c.req.method,
    body: await c.req.text(),
    // override headers to just provide Content-Type
    headers: { "Content-Type": "application/json" },
  });
});

// 503 everything else
app.all("/*", (c) => c.json({ message: "Service Unavailable" }, 503));

app.onError((error, c) => {
  console.error(error);
  return c.text("Internal Server Error", 500);
});

// run node server if local
if (process.env.NODE_ENV !== "production") {
  await import("@hono/node-server").then((m) => {
    const server = m.serve(app, (info) =>
      console.log(`fallback-ensapi is listening on port ${info.port}`),
    );

    // graceful shutdown
    process.on("SIGINT", () => {
      server.close();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      server.close((err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        process.exit(0);
      });
    });
  });
}

export const handler = handle(app);
