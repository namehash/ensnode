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
import { findRegistrationLifecycleDomains } from "@/lib/registrar-actions/find-registration-lifecycle-domians";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";

const app = factory.createApp();

const logger = makeLogger("registrar-actions");

const MAX_REALTIME_DISTANCE: Duration = 10 * 60; // 10 minutes in seconds

// inject c.var.isRealtime derived from MAX_REALTIME_DISTANCE
app.use(makeIsRealtimeMiddleware("registrar-actions-api", MAX_REALTIME_DISTANCE));
// 404 if Registrar Actions API routes cannot be served over HTTP
app.use(requireRegistrarActionsPluginMiddleware());

/**
 * Latest Registrar Actions
 */
app.get("/latest", async (c) => {
  try {
    // 1. Find the latest "logical registrar actions".
    const registrarActions = await findRegistrarActions();

    // 2. a) For each "logical registrar action"
    const registrarActionNodes = registrarActions.map(
      ({ registrationLifecycle }) => registrationLifecycle.node,
    );
    // 2. b) Find the associated Registrar Lifecycle Domain info.
    const registrationLifecycleDomains =
      await findRegistrationLifecycleDomains(registrarActionNodes);

    // Invariant: each "logical registrar action" must have its
    // own Registrar Lifecycle Domain counterpart.
    const eachRegistrarActionHasItsOwnDomain = registrarActionNodes.every(
      (node) => typeof registrationLifecycleDomains[node] !== "undefined",
    );

    if (!eachRegistrarActionHasItsOwnDomain) {
      throw new Error(
        `Each "logical registrar action" must have its own Registrar Lifecycle Domain counterpart.`,
      );
    }

    // respond with success response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Ok,
        registrarActions,
        registrationLifecycleDomains,
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
