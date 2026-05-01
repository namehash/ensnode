import { Hono } from "hono";

import { healthHandler } from "@/handlers/health";
import { submissionsHandler } from "@/handlers/submissions";
import { errorResponse } from "@/lib/error-response";

const app = new Hono();

app.get("/health", healthHandler);

app.post("/api/submissions", submissionsHandler);

app.notFound((c) => errorResponse(c, { message: "Not Found", status: 404 }));

app.onError((error, c) => {
  console.error("[ens-labels-collector] unhandled error", error);
  // Do not leak the underlying error message to clients; respond with a generic 500.
  return errorResponse(c, { message: "Internal Server Error", status: 500 });
});

export default app;
