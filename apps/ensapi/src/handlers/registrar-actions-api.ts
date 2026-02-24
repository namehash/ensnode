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
  getRegistrarActionsByParentNodeRoute,
  getRegistrarActionsRoute,
} from "./registrar-actions-api.routes";

const app = createApp();

const logger = makeLogger("registrar-actions-api");

// Middleware managing access to Registrar Actions API routes.
// It makes the routes available if all prerequisites are met.
app.use(registrarActionsApiMiddleware);

// Shared business logic for fetching registrar actions
async function fetchRegistrarActions(
  parentNode: Node | undefined,
  query: {
    orderBy: string;
    page: number;
    recordsPerPage: number;
    withReferral: boolean;
    decodedReferrer?: string;
    beginTimestamp?: number;
    endTimestamp?: number;
  },
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
 *
 * @see {@link app.openapi(getRegistrarActionsByParentNodeRoute)} for response documentation
 */
app.openapi(getRegistrarActionsRoute, async (c) => {
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
 *
 * Examples of use:
 * - all records associated with `namehash('eth')` parent node:
 *   `GET /api/registrar-actions/0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae`
 * - all records associated with `namehash('base.eth')` parent node:
 *   `GET /api/registrar-actions/0xff1e3c0eb00ec714e34b6114125fbde1dea2f24a72fbf672e7b7fd5690328e10`
 * - all records associated with `namehash('linea.eth')` parent node:
 *   `GET /api/registrar-actions/0x527aac89ac1d1de5dd84cff89ec92c69b028ce9ce3fa3d654882474ab4402ec3`
 *
 * Examples of use with testnets:
 * - all records associated with `namehash('linea-sepolia.eth')` parent node:
 *   `GET /api/registrar-actions/0x1944d8f922dbda424d5bb8181be5344d513cd0210312d2dcccd37d54c11a17de`
 * - all records associated with `namehash('basetest.eth')` parent node:
 *   `GET /api/registrar-actions/0x646204f07e7fcd394a508306bf1148a1e13d14287fa33839bf9ad63755f547c6`
 *
 * Responds with:
 * - 400 error response for bad input, such as:
 *   - (if provided) `page` search param is not a positive integer.
 *   - (if provided) `recordsPerPage` search param is not
 *     a positive integer <= {@link RECORDS_PER_PAGE_MAX}.
 *   - (if provided) `orderBy` search param is not part of {@link RegistrarActionsOrders}.
 *   - (if provided) `beginTimestamp` or `endTimestamp` search params are not valid Unix timestamps.
 *   - (if both provided) `endTimestamp` is less than `beginTimestamp`.
 * - 500 error response for cases such as:
 *   - Connected ENSNode has not all required plugins set to active.
 *   - Connected ENSNode is not in `omnichainStatus` of either
 *     {@link OmnichainIndexingStatusIds.Completed} or
 *     {@link OmnichainIndexingStatusIds.Following}.
 *   - unknown server error occurs.
 */
app.openapi(getRegistrarActionsByParentNodeRoute, async (c) => {
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
