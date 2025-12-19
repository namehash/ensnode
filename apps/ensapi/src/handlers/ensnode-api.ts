import config from "@/config";

import { describeRoute, resolver as validationResolver } from "hono-openapi";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  serializeENSApiPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";
import {
  makeENSApiPublicConfigSchema,
  makeIndexingStatusResponseSchema,
} from "@ensnode/ensnode-sdk/internal";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";

import nameTokensApi from "./name-tokens-api";
import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

app.get(
  "/config",
  describeRoute({
    summary: "Get ENSApi Public Config",
    description: "Gets the public config of the ENSApi instance",
    responses: {
      200: {
        description: "Successfully retrieved ENSApi public config",
        content: {
          "application/json": {
            schema: validationResolver(makeENSApiPublicConfigSchema()),
          },
        },
      },
    },
  }),
  async (c) => {
    const ensApiPublicConfig = buildEnsApiPublicConfig(config);
    return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
  },
);

app.get(
  "/indexing-status",
  describeRoute({
    summary: "Get ENSIndexer Indexing Status",
    description: "Returns the current indexing status of the ENSIndexer",
    responses: {
      200: {
        description: "Successfully retrieved indexing status",
        content: {
          "application/json": {
            schema: validationResolver(makeIndexingStatusResponseSchema()),
          },
        },
      },
      500: {
        description: "Error retrieving indexing status",
        content: {
          "application/json": {
            schema: validationResolver(makeIndexingStatusResponseSchema()),
          },
        },
      },
    },
  }),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(ensnode-api): indexingStatusMiddleware required`);
    }

    if (c.var.indexingStatus instanceof Error) {
      return c.json(
        serializeIndexingStatusResponse({
          responseCode: IndexingStatusResponseCodes.Error,
        } satisfies IndexingStatusResponseError),
        500,
      );
    }

    // return successful response using the indexing status projection from the middleware context
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Ok,
        realtimeProjection: c.var.indexingStatus,
      } satisfies IndexingStatusResponseOk),
    );
  },
);

// Name Tokens API
app.route("/name-tokens", nameTokensApi);

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
