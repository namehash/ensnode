import {
  type Duration,
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { requireRegistrarActionsPluginMiddleware } from "@/lib/middleware/require-registrar-actions-plugins..middleware";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";

const app = factory.createApp();

const MAX_REALTIME_DISTANCE: Duration = 10 * 60; // 10 minutes in seconds

// inject c.var.isRealtime derived from MAX_REALTIME_DISTANCE
app.use(makeIsRealtimeMiddleware("registrar-actions-api", MAX_REALTIME_DISTANCE));
// 404 if Registrar Actions API routes cannot be served over HTTP
app.use(requireRegistrarActionsPluginMiddleware());

/**
 * Latest Registrar Actions
 */
app.get("/latest", async (c) => {
  let response: RegistrarActionsResponse;

  try {
    response = {
      responseCode: RegistrarActionsResponseCodes.Ok,
      registrarActions: await findRegistrarActions(),
    } satisfies RegistrarActionsResponseOk;
  } catch {
    response = {
      responseCode: RegistrarActionsResponseCodes.Error,
    } satisfies RegistrarActionsResponseError;
  }

  return c.json(serializeRegistrarActionsResponse(response));
});

export default app;
