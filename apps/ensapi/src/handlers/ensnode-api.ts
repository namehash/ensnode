import config from "@/config";

import { describeRoute, resolver } from "hono-openapi";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  makeENSApiPublicConfigSchema,
  makeIndexingStatusResponseSchema,
  serializeENSApiPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";

import nameTokensApi from "./name-tokens-api";
import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

// include ENSApi Public Config endpoint
app.get(
  "/config",
  describeRoute({
    summary: "Get ENSApi Configuration",
    description: "Returns the public configuration of the ENSApi instance",
    responses: {
      200: {
        description: "Successfully retrieved configuration",
        content: {
          "application/json": {
            schema: resolver(makeENSApiPublicConfigSchema()),
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

// include ENSIndexer Indexing Status endpoint
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
            schema: resolver(makeIndexingStatusResponseSchema()),
          },
        },
      },
      500: {
        description: "Error retrieving indexing status",
        content: {
          "application/json": {
            schema: resolver(makeIndexingStatusResponseSchema()),
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

    // return successful response using the indexing status projection from the context
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
