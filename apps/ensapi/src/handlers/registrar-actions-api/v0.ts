import { describeRoute } from "hono-openapi";

import {
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";

import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { registrarActionsApiMiddleware } from "@/middleware/registrar-actions.middleware";

import {
  fetchRegistrarActions,
  registrarActionsParamsSchema,
  registrarActionsQuerySchema,
} from "./shared";

const app = factory.createApp();

const logger = makeLogger("registrar-actions-api");

// Middleware managing access to Registrar Actions API routes.
// It makes the routes available if all prerequisites are met.
app.use(registrarActionsApiMiddleware);

/**
 * Get Registrar Actions (all records)
 *
 * Example: `GET /api/registrar-actions`
 *
 * @see {@link app.get("/:parentNode")} for response documentation
 */
app.get(
  "/",
  describeRoute({
    tags: ["Explore"],
    summary: "Get Registrar Actions",
    description: "Returns all registrar actions with optional filtering and pagination",
    responses: {
      200: {
        description: "Successfully retrieved registrar actions",
      },
      400: {
        description: "Invalid query",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
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
  },
);

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
app.get(
  "/:parentNode",
  describeRoute({
    tags: ["Explore"],
    summary: "Get Registrar Actions by Parent Node",
    description:
      "Returns registrar actions filtered by parent node hash with optional additional filtering and pagination",
    responses: {
      200: {
        description: "Successfully retrieved registrar actions",
      },
      400: {
        description: "Invalid input",
      },
      500: {
        description: "Internal server error",
      },
    },
  }),
  validate("param", registrarActionsParamsSchema),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
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
  },
);

export default app;
