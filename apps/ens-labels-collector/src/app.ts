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
  return errorResponse(c, { error });
});

export default app;
