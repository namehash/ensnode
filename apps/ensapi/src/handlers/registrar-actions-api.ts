import type { z } from "zod/v4";

import {
  buildPageContext,
  type Node,
  type RegistrarActionsFilter,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  registrarActionsFilter,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { createApp } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import { registrarActionsApiMiddleware } from "@/middleware/registrar-actions.middleware";

import {
  registrarActionsByParentNodeGetMeta,
  registrarActionsGetMeta,
  type registrarActionsQuerySchema,
} from "./registrar-actions-api.routes";

const app = createApp();

const logger = makeLogger("registrar-actions-api");

// Middleware managing access to Registrar Actions API routes.
// It makes the routes available if all prerequisites are met.
app.use(registrarActionsApiMiddleware);

// Shared business logic for fetching registrar actions
async function fetchRegistrarActions(
  parentNode: Node | undefined,
  query: z.infer<typeof registrarActionsQuerySchema>,
) {
  const {
    orderBy,
    page,
    recordsPerPage,
    withReferral,
    decodedReferrer,
    beginTimestamp,
    endTimestamp,
  } = query;

  const filters: RegistrarActionsFilter[] = [];

  if (parentNode) {
    filters.push(registrarActionsFilter.byParentNode(parentNode));
  }

  if (withReferral) {
    filters.push(registrarActionsFilter.withReferral(true));
  }

  if (decodedReferrer) {
    filters.push(registrarActionsFilter.byDecodedReferrer(decodedReferrer));
  }

  if (beginTimestamp) {
    filters.push(registrarActionsFilter.beginTimestamp(beginTimestamp));
  }

  if (endTimestamp) {
    filters.push(registrarActionsFilter.endTimestamp(endTimestamp));
  }

  // Calculate offset from page and recordsPerPage
  const offset = (page - 1) * recordsPerPage;

  // Find the latest "logical registrar actions" with pagination
  const { registrarActions, totalRecords } = await findRegistrarActions({
    filters,
    orderBy,
    limit: recordsPerPage,
    offset,
  });

  // Build page context
  const pageContext = buildPageContext(page, recordsPerPage, totalRecords);

  return { registrarActions, pageContext };
}

/**
 * Get Registrar Actions (all records)
 *
 * Example: `GET /api/registrar-actions`
 */
app.openapi(registrarActionsGetMeta, async (c) => {
  try {
    const query = c.req.valid("query");
    const { registrarActions, pageContext } = await fetchRegistrarActions(undefined, query);

    // respond with success response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Ok,
        registrarActions,
        pageContext,
      } satisfies RegistrarActionsResponseOk),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(errorMessage);

    // respond with 500 error response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Error,
        error: {
          message: `Registrar Actions API Response is unavailable`,
        },
      } satisfies RegistrarActionsResponseError),
      500,
    );
  }
});

/**
 * Get Registrar Actions (filtered by parent node)
 */
app.openapi(registrarActionsByParentNodeGetMeta, async (c) => {
  try {
    // Middleware ensures indexingStatus is available and not an Error
    // This check is for TypeScript type safety
    if (!c.var.indexingStatus || c.var.indexingStatus instanceof Error) {
      throw new Error("Invariant violation: indexingStatus should be validated by middleware");
    }

    const { parentNode } = c.req.valid("param");
    const query = c.req.valid("query");
    const { registrarActions, pageContext } = await fetchRegistrarActions(parentNode, query);

    // Get the accurateAsOf timestamp from the slowest chain indexing cursor
    const accurateAsOf = c.var.indexingStatus.snapshot.slowestChainIndexingCursor;

    // respond with success response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Ok,
        registrarActions,
        pageContext,
        accurateAsOf,
      } satisfies RegistrarActionsResponseOk),
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(errorMessage);

    // respond with 500 error response
    return c.json(
      serializeRegistrarActionsResponse({
        responseCode: RegistrarActionsResponseCodes.Error,
        error: {
          message: `Registrar Actions API Response is unavailable`,
        },
      } satisfies RegistrarActionsResponseError),
      500,
    );
  }
});

export default app;
