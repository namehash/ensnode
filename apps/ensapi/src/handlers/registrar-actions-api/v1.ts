import { describeRoute } from "hono-openapi";

import {
  buildResultOkRegistrarActions,
  ResultCodes,
  registrarActionsPrerequisites,
  serializeResultOkRegistrarActions,
} from "@ensnode/ensnode-sdk";

import { validateApiHandlerPrerequisites } from "@/lib/handlers/api-handler-prerequisites";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { openApiResponsesRegistrarActionsApi } from "@/lib/open-api/registrar-actions-api-responses";
import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";

import {
  fetchRegistrarActions,
  registrarActionsParamsSchema,
  registrarActionsQuerySchema,
} from "./shared";

const app = factory.createApp();

/**
 * Get Registrar Actions (all records)
 *
 * Example: `GET /api/v1/registrar-actions`
 *
 * @see {@link app.get("/:parentNode")} for response documentation
 */
app.get(
  "/",
  describeRoute({
    tags: ["Explore"],
    summary: "Get Registrar Actions",
    description: "Returns all registrar actions with optional filtering and pagination",
    responses: openApiResponsesRegistrarActionsApi,
  }),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
    const validationResult = validateApiHandlerPrerequisites(
      c.var.indexingStatus,
      registrarActionsPrerequisites.requiredPlugins,
    );

    // Prerequisite not met, so return error response
    if (validationResult.resultCode !== ResultCodes.Ok) {
      return resultIntoHttpResponse(c, validationResult);
    }

    const query = c.req.valid("query");
    const { indexingStatus } = validationResult.data;
    const { registrarActions, pageContext } = await fetchRegistrarActions(undefined, query);

    // Get the accurateAsOf timestamp from the slowest chain indexing cursor
    const accurateAsOf = indexingStatus.snapshot.slowestChainIndexingCursor;

    const result = buildResultOkRegistrarActions(
      {
        registrarActions,
        pageContext,
      },
      accurateAsOf,
    );

    const serializedResult = serializeResultOkRegistrarActions(result);

    return resultIntoHttpResponse(c, serializedResult);
  },
);

/**
 * Get Registrar Actions (filtered by parent node)
 *
 * Examples of use:
 * - all records associated with `namehash('eth')` parent node:
 *   `GET /api/v1/registrar-actions/0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae`
 * - all records associated with `namehash('base.eth')` parent node:
 *   `GET /api/v1/registrar-actions/0xff1e3c0eb00ec714e34b6114125fbde1dea2f24a72fbf672e7b7fd5690328e10`
 * - all records associated with `namehash('linea.eth')` parent node:
 *   `GET /api/v1/registrar-actions/0x527aac89ac1d1de5dd84cff89ec92c69b028ce9ce3fa3d654882474ab4402ec3`
 *
 * Examples of use with testnets:
 * - all records associated with `namehash('linea-sepolia.eth')` parent node:
 *   `GET /api/v1/registrar-actions/0x1944d8f922dbda424d5bb8181be5344d513cd0210312d2dcccd37d54c11a17de`
 * - all records associated with `namehash('basetest.eth')` parent node:
 *   `GET /api/v1/registrar-actions/0x646204f07e7fcd394a508306bf1148a1e13d14287fa33839bf9ad63755f547c6`
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
 *   - Failed invariants
 * - 503 error response for cases such as:
 *   - Connected ENSNode has not all required plugins set to active.
 *   - Connected ENSNode is not in `omnichainStatus` of either
 *     {@link OmnichainIndexingStatusIds.Completed} or
 *     {@link OmnichainIndexingStatusIds.Following}.
 */
app.get(
  "/:parentNode",
  describeRoute({
    tags: ["Explore"],
    summary: "Get Registrar Actions by Parent Node",
    description:
      "Returns registrar actions filtered by parent node hash with optional additional filtering and pagination",
    responses: openApiResponsesRegistrarActionsApi,
  }),
  validate("param", registrarActionsParamsSchema),
  validate("query", registrarActionsQuerySchema),
  async (c) => {
    const validationResult = validateApiHandlerPrerequisites(
      c.var.indexingStatus,
      registrarActionsPrerequisites.requiredPlugins,
    );

    // Prerequisite not met, so return error response
    if (validationResult.resultCode !== ResultCodes.Ok) {
      return resultIntoHttpResponse(c, validationResult);
    }

    const { parentNode } = c.req.valid("param");
    const query = c.req.valid("query");
    const { indexingStatus } = validationResult.data;
    const { registrarActions, pageContext } = await fetchRegistrarActions(parentNode, query);

    // Get the accurateAsOf timestamp from the slowest chain indexing cursor
    const accurateAsOf = indexingStatus.snapshot.slowestChainIndexingCursor;

    const result = buildResultOkRegistrarActions(
      {
        registrarActions,
        pageContext,
      },
      accurateAsOf,
    );

    const serializedResult = serializeResultOkRegistrarActions(result);

    return resultIntoHttpResponse(c, serializedResult);
  },
);

export default app;
