import { describeRoute, resolver as responseSchemaResolver } from "hono-openapi";
import z from "zod/v4";

import {
  buildPageContext,
  buildRegistrarActionsResultOk,
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultServiceUnavailable,
  type InterpretedName,
  type Node,
  RECORDS_PER_PAGE_DEFAULT,
  RECORDS_PER_PAGE_MAX,
  type RegistrarActionsFilter,
  RegistrarActionsOrders,
  RegistrarActionTypes,
  ResultCodes,
  registrarActionsFilter,
  serializeRegistrarActionsResultOk,
} from "@ensnode/ensnode-sdk";
import {
  makeLowercaseAddressSchema,
  makeNodeSchema,
  makePositiveIntegerSchema,
  makeRegistrarActionsResultOkSchema,
  makeResultErrorInsufficientIndexingProgressSchema,
  makeResultErrorInternalServerErrorSchema,
  makeResultErrorInvalidRequestSchema,
  makeResultErrorServiceUnavailableSchema,
  makeUnixTimestampSchema,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";
import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";
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

const routeResponsesDescription = {
  200: {
    description: "Successfully retrieved registrar actions",
    content: {
      "application/json": {
        schema: responseSchemaResolver(makeRegistrarActionsResultOkSchema(true)),
        examples: {
          [`Result Code: ${ResultCodes.Ok}`]: {
            summary: "Successfully retrieved registrar actions",
            value: serializeRegistrarActionsResultOk(
              buildRegistrarActionsResultOk(
                {
                  registrarActions: [
                    {
                      action: {
                        id: "176901653900000000000000010000000024284662000000000000016650000000000000521",
                        type: RegistrarActionTypes.Registration,
                        incrementalDuration: 31536000,
                        registrant: "0x5438f076431321224969fc258d1c99d340b8af5a",
                        registrationLifecycle: {
                          subregistry: {
                            subregistryId: {
                              chainId: 1,
                              address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                            },
                            node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
                          },
                          node: "0x286f7fa67d93511310a9f9e21e54b780eb3cf8e4887e20d6e6d6c59e2b1a0213",
                          expiresAt: 1800552539,
                        },
                        pricing: {
                          baseCost: {
                            currency: "ETH",
                            amount: BigInt("1726125951960390"),
                          },
                          premium: {
                            currency: "ETH",
                            amount: BigInt("591384407687275916"),
                          },
                          total: {
                            currency: "ETH",
                            amount: BigInt("593110533639236306"),
                          },
                        },
                        referral: {
                          encodedReferrer:
                            "0x0000000000000000000000007e491cde0fbf08e51f54c4fb6b9e24afbd18966d",
                          decodedReferrer: "0x7e491cde0fbf08e51f54c4fb6b9e24afbd18966d",
                        },
                        block: {
                          number: 24284662,
                          timestamp: 1769016539,
                        },
                        transactionHash:
                          "0xb87a54ebb64e2ebc581127e7f71f7c56090a5c92583ce238644ce3ec23e1c13c",
                        eventIds: [
                          "176901653900000000000000010000000024284662000000000000016650000000000000521",
                          "176901653900000000000000010000000024284662000000000000016650000000000000525",
                        ],
                      },
                      name: "export.eth" as InterpretedName,
                    },
                  ],
                  pageContext: buildPageContext(1, 10, 0),
                },
                1700000000,
              ),
            ),
          },
        },
      },
    },
  },
  400: {
    description: "Invalid request parameters",
    content: {
      "application/json": {
        schema: responseSchemaResolver(makeResultErrorInvalidRequestSchema()),
        examples: {
          [`Result Code: ${ResultCodes.InvalidRequest}`]: {
            summary: "Registrar Actions API invalid request",
            value: buildResultInvalidRequest(
              "parentNode param must be a hexadecimal value which starts with '0x'",
            ),
            description: "The provided `parentNode` query parameter is not a hexadecimal value.",
          },
        },
      },
    },
  },
  500: {
    description: "An internal server error occurred",
    content: {
      "application/json": {
        schema: responseSchemaResolver(makeResultErrorInternalServerErrorSchema()),
        examples: {
          [`Result Code: ${ResultCodes.InternalServerError}`]: {
            summary: "Registrar Actions API internal server error",
            value: buildResultInternalServerError(
              "Internal server error occurred in Registrar Actions API.",
            ),
            description: "External service or dependency is unavailable.",
          },
        },
      },
    },
  },
  503: {
    description: "Registrar Actions API is unavailable",
    content: {
      "application/json": {
        schema: responseSchemaResolver(
          z.discriminatedUnion("resultCode", [
            makeResultErrorServiceUnavailableSchema(),
            makeResultErrorInsufficientIndexingProgressSchema(),
          ]),
        ),
        examples: {
          [`Result Code: ${ResultCodes.ServiceUnavailable}`]: {
            summary: "Registrar Actions API is unavailable",
            value: buildResultServiceUnavailable("Registrar Actions API is currently unavailable."),
            description: "External service or dependency is unavailable.",
          },
          [`Result Code: ${ResultCodes.InsufficientIndexingProgress}`]: {
            summary: "Registrar Actions API has insufficient indexing progress",
            value: buildResultInsufficientIndexingProgress(
              "The connected ENSIndexer has insufficient omnichain indexing progress to serve this request.",
              {
                indexingStatus: "omnichain-backfill",
                slowestChainIndexingCursor: 1700000000,
                earliestChainIndexingCursor: 1690000000,
                progressSufficientFrom: {
                  indexingStatus: "omnichain-following",
                  chainIndexingCursor: 1705000000,
                },
              },
            ),
          },
        },
      },
    },
  },
};

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
    responses: routeResponsesDescription,
  }),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
    // Middleware ensures indexingStatus is available and not an Error
    // This check is for TypeScript type safety, should never occur in
    // practice.
    if (!c.var.indexingStatus || c.var.indexingStatus instanceof Error) {
      const result = buildResultServiceUnavailable(
        "Invariant(registrar-actions-api): indexingStatus must be available in the application context",
      );

      return resultIntoHttpResponse(c, result);
    }

    const query = c.req.valid("query");

    try {
      const { registrarActions, pageContext } = await fetchRegistrarActions(undefined, query);

      // Get the accurateAsOf timestamp from the slowest chain indexing cursor
      const accurateAsOf = c.var.indexingStatus.snapshot.slowestChainIndexingCursor;

      const result = buildRegistrarActionsResultOk(
        {
          registrarActions,
          pageContext,
        },
        accurateAsOf,
      );

      const serializedResult = serializeRegistrarActionsResultOk(result);

      return resultIntoHttpResponse(c, serializedResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(errorMessage);

      const result = buildResultServiceUnavailable(
        `Registrar Actions API Response is unavailable due to following error: ${errorMessage}`,
      );

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
    responses: routeResponsesDescription,
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
    // Middleware ensures indexingStatus is available and not an Error
    // This check is for TypeScript type safety, should never occur in
    // practice.
    if (!c.var.indexingStatus || c.var.indexingStatus instanceof Error) {
      const result = buildResultServiceUnavailable(
        "Invariant(registrar-actions-api): indexingStatus must be available in the application context",
      );

      return resultIntoHttpResponse(c, result);
    }

    const { parentNode } = c.req.valid("param");
    const query = c.req.valid("query");

    try {
      const { registrarActions, pageContext } = await fetchRegistrarActions(parentNode, query);

      // Get the accurateAsOf timestamp from the slowest chain indexing cursor
      const accurateAsOf = c.var.indexingStatus.snapshot.slowestChainIndexingCursor;

      const result = buildRegistrarActionsResultOk(
        {
          registrarActions,
          pageContext,
        },
        accurateAsOf,
      );

      const serializedResult = serializeRegistrarActionsResultOk(result);

      return resultIntoHttpResponse(c, serializedResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(errorMessage);

      const result = buildResultServiceUnavailable(
        `Registrar Actions API Response is unavailable due to following error: ${errorMessage}`,
      );

      return resultIntoHttpResponse(c, result);
    }
  },
);

export default app;
