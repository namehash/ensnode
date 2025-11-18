import z from "zod/v4";

import {
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  registrarActionsFilter,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";
import { makeNodeSchema, makePositiveIntegerSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { requireRegistrarActionsPluginMiddleware } from "@/lib/middleware/require-registrar-actions-plugins..middleware";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";

const app = factory.createApp();

const logger = makeLogger("registrar-actions");

// Middleware managing access to Registrar Actions API routes.
// It makes the routes available if all prerequisites are met.
app.use(requireRegistrarActionsPluginMiddleware());

const RESPONSE_ITEMS_PER_PAGE_DEFAULT = 25;
const RESPONSE_ITEMS_PER_PAGE_MAX = 100;

/**
 * Get Registrar Actions
 *
 * Examples of use:
 * - all records: `GET /api/registrar-actions`
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
 *   - (if provided) `limit` search param is not
 *     a positive integer <= {@link RESPONSE_ITEMS_PER_PAGE_MAX}.
 *   - (if provided) `orderBy` search param is not part of {@link RegistrarActionsOrders}.
 * - 500 error response for cases such as:
 *   - Connected ENSNode has not all required plugins set to active.
 *   - Connected ENSNode is not in `omnichainStatus` of either
 *     {@link OmnichainIndexingStatusIds.Completed} or
 *     {@link OmnichainIndexingStatusIds.Following}.
 *   - unknown server error occurs.
 */
app.get(
  "/:parentNode?",
  validate(
    "param",
    z.object({
      parentNode: makeNodeSchema("parentNode param").optional(),
    }),
  ),
  validate(
    "query",
    z.object({
      orderBy: z
        .enum(RegistrarActionsOrders)
        .default(RegistrarActionsOrders.LatestRegistrarActions),

      itemsPerPage: params.queryParam
        .optional()
        .default(RESPONSE_ITEMS_PER_PAGE_DEFAULT)
        .pipe(z.coerce.number())
        .pipe(makePositiveIntegerSchema().max(RESPONSE_ITEMS_PER_PAGE_MAX)),
    }),
  ),
  async (c) => {
    try {
      const { parentNode } = c.req.valid("param");
      const { orderBy, itemsPerPage } = c.req.valid("query");
      const filter = registrarActionsFilter.byParentNode(parentNode);

      // Find the latest "logical registrar actions".
      const registrarActions = await findRegistrarActions({
        filter,
        orderBy,
        limit: itemsPerPage,
      });

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
