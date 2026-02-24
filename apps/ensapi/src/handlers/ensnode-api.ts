import config from "@/config";

import { describeRoute, resolver as validationResolver } from "hono-openapi";

import {
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
  serializeEnsApiIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";
import { makeIndexingStatusResponseSchema } from "@ensnode/ensnode-sdk/internal";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";

import ensnodeGraphQLApi from "./ensnode-graphql-api";
import nameTokensApi from "./name-tokens-api";
import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

app.get(
  "/indexing-status",
  describeRoute({
    tags: ["Meta"],
    summary: "Get ENSIndexer Indexing Status",
    description: "Returns the indexing status snapshot most recently captured from ENSIndexer",
    responses: {
      200: {
        description: "Successfully retrieved indexing status",
        content: {
          "application/json": {
            schema: validationResolver(makeIndexingStatusResponseSchema()),
          },
        },
      },
      503: {
        description: "Indexing status snapshot unavailable",
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
      throw new Error(`Invariant(indexing-status): indexingStatusMiddleware required`);
    }

    if (c.var.indexingStatus instanceof Error) {
      return c.json(
        serializeEnsApiIndexingStatusResponse({
          responseCode: EnsApiIndexingStatusResponseCodes.Error,
        } satisfies EnsApiIndexingStatusResponseError),
        503,
      );
    }

    const ensApiPublicConfig = buildEnsApiPublicConfig(config);

    // return successful response using the indexing status projection from the middleware context
    return c.json(
      serializeEnsApiIndexingStatusResponse({
        responseCode: EnsApiIndexingStatusResponseCodes.Ok,
        realtimeProjection: c.var.indexingStatus,
        config: ensApiPublicConfig,
      } satisfies EnsApiIndexingStatusResponseOk),
    );
  },
);

// Name Tokens API
app.route("/name-tokens", nameTokensApi);

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

// ENSNode GraphQL API
app.route("/graphql", ensnodeGraphQLApi);

export default app;
