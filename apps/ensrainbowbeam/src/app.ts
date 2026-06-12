import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthHandler } from "@/handlers/health";
import { submissionsHandler } from "@/handlers/submissions";
import { errorResponse } from "@/lib/error-response";

const app = new Hono();

// Enable CORS broadly (like other ENSNode HTTP services).
app.use(
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

app.get("/health", healthHandler);

app.post("/api/discover", submissionsHandler);

app.notFound((c) => errorResponse(c, { message: "Not Found", status: 404 }));

app.onError((error, c) => {
  console.error("[ensrainbowbeam] unhandled error", error);
  // Do not leak the underlying error message to clients; respond with a generic 500.
  return errorResponse(c, { message: "Internal Server Error", status: 500 });
});

export default app;
