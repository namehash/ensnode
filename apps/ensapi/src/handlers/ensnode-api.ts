import config from "@/config";

import { describeRoute } from "hono-openapi";

import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  serializeENSApiPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";

import { getConfigRoute, getIndexingStatusRoute } from "./ensnode-api.routes";
import ensnodeGraphQLApi from "./ensnode-graphql-api";
import nameTokensApi from "./name-tokens-api";
import registrarActionsApi from "./registrar-actions-api";
import resolutionApi from "./resolution-api";

const app = factory.createApp();

app.get("/config", describeRoute(getConfigRoute), async (c) => {
  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
});

app.get("/indexing-status", describeRoute(getIndexingStatusRoute), async (c) => {
  // context must be set by the required middleware
  if (c.var.indexingStatus === undefined) {
    throw new Error(`Invariant(indexing-status): indexingStatusMiddleware required`);
  }

  if (c.var.indexingStatus instanceof Error) {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      503,
    );
  }

  // return successful response using the indexing status projection from the middleware context
  return c.json(
    serializeIndexingStatusResponse({
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection: c.var.indexingStatus,
    } satisfies IndexingStatusResponseOk),
  );
});

// Name Tokens API
app.route("/name-tokens", nameTokensApi);

// Registrar Actions API
app.route("/registrar-actions", registrarActionsApi);

// Resolution API
app.route("/resolve", resolutionApi);

// ENSNode GraphQL API
app.route("/graphql", ensnodeGraphQLApi);

export default app;
