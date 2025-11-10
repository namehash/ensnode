import {
  type Duration,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { requireRegistrarActionsPluginMiddleware } from "@/lib/middleware/require-registrar-actions-plugins..middleware";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";

const app = factory.createApp();

const logger = makeLogger("registrar-actions");

const MAX_REALTIME_DISTANCE: Duration = 10 * 60; // 10 minutes in seconds

// inject c.var.isRealtime derived from MAX_REALTIME_DISTANCE
app.use(makeIsRealtimeMiddleware("registrar-actions-api", MAX_REALTIME_DISTANCE));
// 404 if Registrar Actions API routes cannot be served over HTTP
app.use(requireRegistrarActionsPluginMiddleware());

/**
 * Get Registrar Actions
 */
app.get("/", async (c) => {
  try {
    // Find the latest "logical registrar actions".
    const registrarActions = await findRegistrarActions();

    // respond with success response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Ok,
        registrarActions,
      } satisfies RegistrarActionsResponseOk),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(errorMessage);

    // respond with 500 error response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Error,
      } satisfies RegistrarActionsResponseError),
      500,
    );
  }
});

export default app;
