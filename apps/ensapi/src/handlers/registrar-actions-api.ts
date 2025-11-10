import { namehash } from "viem";
import z from "zod/v4";

import {
  type NormalizedName,
  type RegistrarActionsFilter,
  RegistrarActionsFilterFields,
  RegistrarActionsOrders,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
  serializeRegistrarActionsResponse,
} from "@ensnode/ensnode-sdk";
import { makePositiveIntegerSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { requireRegistrarActionsPluginMiddleware } from "@/lib/middleware/require-registrar-actions-plugins..middleware";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";

const app = factory.createApp();

const logger = makeLogger("registrar-actions");

// Server error if Registrar Actions API routes cannot be served over HTTP
app.use(requireRegistrarActionsPluginMiddleware());

const DEFAULT_RESPONSE_ITEMS_COUNT_LIMIT = 25;

/**
 * Build a "parent name" filter object for Registrar Actions query.
 */
function buildFilterForParentName(
  parentName: NormalizedName | undefined,
): RegistrarActionsFilter | undefined {
  if (typeof parentName === "undefined") {
    return undefined;
  }

  const subregistryNode = namehash(parentName);

  return {
    field: RegistrarActionsFilterFields.SubregistryNode,
    comparator: "eq",
    value: subregistryNode,
  };
}

/**
 * Get Registrar Actions
 *
 * Examples of use:
 * - all records: `GET /api/registrar-actions`
 * - all records associated with `eth` parent name: `GET /api/registrar-actions/eth`
 * - all records associated with `base.eth` parent name: `GET /api/registrar-actions/base.eth`
 * - all records associated with `linea.eth` parent name: `GET /api/registrar-actions/linea.eth`
 *
 * Examples of use with testnest:
 * - all records associated with `linea-sepolia.eth` `GET /api/registrar-actions/linea-sepolia.eth`
 * - all records associated with `linea-sepolia.eth` `GET /api/registrar-actions/basetest.eth`
 *
 * Responds with:
 * - 400 error response for bad input, such as:
 *   - (if provided) `parentName` path param points to a name not associated with any indexed subregistries.
 *   - (if provided) `limit` search param is not a positive integer.
 *   - (if provided) `orderBy` search param is not part of {@link RegistrarActionsOrders}.
 * - 500 error response for cases such as:
 *   - Connected ENSNode has not all required plugins set to active.
 *   - Connected ENSNode is not in `omnichainStatus` of either
 *     {@link OmnichainIndexingStatusIds.Completed} or
 *     {@link OmnichainIndexingStatusIds.Following}.
 *   - unknown server error occurs.
 */
app.get(
  "/:parentName?",
  validate(
    "param",
    z.object({
      parentName: params.name
        .optional()
        .transform((v) => (typeof v !== "undefined" ? (v as NormalizedName) : v)),
    }),
  ),
  validate(
    "query",
    z.object({
      orderBy: z
        .enum(RegistrarActionsOrders)
        .default(RegistrarActionsOrders.LatestRegistrarActions),

      limit: params.queryParam
        .optional()
        .default(DEFAULT_RESPONSE_ITEMS_COUNT_LIMIT)
        .pipe(z.coerce.number())
        .pipe(makePositiveIntegerSchema()),
    }),
  ),
  async (c) => {
    try {
      const { parentName } = c.req.valid("param");
      const { orderBy, limit } = c.req.valid("query");
      const filter = buildFilterForParentName(parentName);

      // Find the latest "logical registrar actions".
      const registrarActions = await findRegistrarActions({
        filter,
        orderBy,
        limit,
      });

      const noRecordsForParentName =
        typeof parentName !== "undefined" && registrarActions.length === 0;

      if (noRecordsForParentName) {
        // respond with bad request error
        return c.json(
          serializeRegistrarActionsResponse({
            responseCode: RegistrarActionsResponseCodes.Error,
            error: {
              message: `Registrar Actions API Bad request: no records were found for requested '${parentName}' parent name.`,
            },
          } satisfies RegistrarActionsResponseError),
          400,
        );
      }

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
