import {
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import { requireRegistrarActionsPluginsMiddleware } from "@/middleware/require-registrar-actions-plugins.middleware";

const app = factory.createApp();

// 404 if all required plugins for Registrar Actions API were not enabled
app.use(requireRegistrarActionsPluginsMiddleware());

// TODO: require "worstCaseDistance" of the Indexing Status API to be within an expected range.

/**
 * Latest Registrar Actions
 */
app.get("/latest", async (c) => {
  let response: RegistrarActionsResponse;

  try {
    const registrarActions = await findRegistrarActions();

    response = {
      responseCode: RegistrarActionsResponseCodes.Ok,
      registrarActions,
    } satisfies RegistrarActionsResponseOk;
  } catch {
    response = {
      responseCode: RegistrarActionsResponseCodes.Error,
    } satisfies RegistrarActionsResponseError;
  }

  return c.json(serializeRegistrarActionsResponse(response));
});

export default app;
