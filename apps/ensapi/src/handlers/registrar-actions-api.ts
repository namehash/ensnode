import { describeRoute } from "hono-openapi";
import z from "zod/v4";

import {
  buildPageContext,
  buildResultOkTimestamped,
  buildResultServiceUnavailable,
  type Node,
  RECORDS_PER_PAGE_DEFAULT,
  RECORDS_PER_PAGE_MAX,
  type RegistrarActionsFilter,
  RegistrarActionsOrders,
  ResultCodes,
  registrarActionsFilter,
  serializeNamedRegistrarActions,
} from "@ensnode/ensnode-sdk";
import {
  makeLowercaseAddressSchema,
  makeNodeSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import {
  resultCodeToHttpStatusCode,
  resultIntoHttpResponse,
} from "@/lib/result/result-into-http-response";
import { registrarActionsApiMiddleware } from "@/middleware/registrar-actions.middleware";

const app = factory.createApp();

const logger = makeLogger("registrar-actions-api");

// Middleware managing access to Registrar Actions API routes.
// It makes the routes available if all prerequisites are met.
app.use(registrarActionsApiMiddleware);

// Shared query schema for registrar actions
const registrarActionsQuerySchema = z
  .object({
    orderBy: z
      .enum(RegistrarActionsOrders)
      .default(RegistrarActionsOrders.LatestRegistrarActions)
      .describe("Order of results"),

    page: params.queryParam
      .optional()
      .default(1)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("page"))
      .describe("Page number for pagination"),

    recordsPerPage: params.queryParam
      .optional()
      .default(RECORDS_PER_PAGE_DEFAULT)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("recordsPerPage").max(RECORDS_PER_PAGE_MAX))
      .describe("Number of records per page"),

    withReferral: params.boolstring
      .optional()
      .default(false)
      .describe("Filter to only include actions with referrals"),

    decodedReferrer: makeLowercaseAddressSchema("decodedReferrer")
      .optional()
      .describe("Filter by decoded referrer address"),

    beginTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("beginTimestamp"))
      .optional()
      .describe("Filter actions at or after this Unix timestamp"),

    endTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("endTimestamp"))
      .optional()
      .describe("Filter actions at or before this Unix timestamp"),
  })
  .refine(
    (data) => {
      // If both timestamps are provided, endTimestamp must be >= beginTimestamp
      if (data.beginTimestamp !== undefined && data.endTimestamp !== undefined) {
        return data.endTimestamp >= data.beginTimestamp;
      }
      return true;
    },
    {
      message: "endTimestamp must be greater than or equal to beginTimestamp",
      path: ["endTimestamp"],
    },
  );

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
      [resultCodeToHttpStatusCode(ResultCodes.Ok)]: {
        description: "Successfully retrieved registrar actions",
      },
      [resultCodeToHttpStatusCode(ResultCodes.InvalidRequest)]: {
        description: "Invalid query",
      },
      [resultCodeToHttpStatusCode(ResultCodes.ServiceUnavailable)]: {
        description: "Registrar Actions API is unavailable at the moment",
      },
    },
  }),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
    try {
      // Middleware ensures indexingStatus is available and not an Error
      // This check is for TypeScript type safety
      if (!c.var.indexingStatus || c.var.indexingStatus instanceof Error) {
        throw new Error("Invariant violation: indexingStatus should be validated by middleware");
      }

      const query = c.req.valid("query");
      const { registrarActions, pageContext } = await fetchRegistrarActions(undefined, query);

      // Get the accurateAsOf timestamp from the slowest chain indexing cursor
      const accurateAsOf = c.var.indexingStatus.snapshot.slowestChainIndexingCursor;

      const result = buildResultOkTimestamped(
        {
          registrarActions: serializeNamedRegistrarActions(registrarActions),
          pageContext,
        },
        accurateAsOf,
      );

      return resultIntoHttpResponse(c, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(errorMessage);

      const result = buildResultServiceUnavailable("Registrar Actions API Response is unavailable");

      return resultIntoHttpResponse(c, result);
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
      [resultCodeToHttpStatusCode(ResultCodes.Ok)]: {
        description: "Successfully retrieved registrar actions",
      },
      [resultCodeToHttpStatusCode(ResultCodes.InvalidRequest)]: {
        description: "Invalid query",
      },
      [resultCodeToHttpStatusCode(ResultCodes.ServiceUnavailable)]: {
        description: "Registrar Actions API is unavailable at the moment",
      },
    },
  }),
  validate(
    "param",
    z.object({
      parentNode: makeNodeSchema("parentNode param").describe(
        "Parent node to filter registrar actions",
      ),
    }),
  ),
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

      const result = buildResultOkTimestamped(
        {
          registrarActions: serializeNamedRegistrarActions(registrarActions),
          pageContext,
        },
        accurateAsOf,
      );

      return resultIntoHttpResponse(c, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(errorMessage);

      const result = buildResultServiceUnavailable("Registrar Actions API Response is unavailable");

      return resultIntoHttpResponse(c, result);
    }
  },
);

export default app;
