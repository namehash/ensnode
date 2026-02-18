import {
  IndexingStatusResponseCodes,
  type IndexingStatusResponseError,
  type IndexingStatusResponseOk,
  serializeENSApiPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

import { buildEnsApiPublicConfig } from "@/config/config.schema";
import { createApp } from "@/lib/hono-factory";

import { basePath, configGetMeta, indexingStatusGetMeta } from "./ensnode-api.routes";
import ensnodeGraphQLApi from "./ensnode-graphql-api";
import nameTokensApi from "./name-tokens-api";
import { basePath as nameTokensBasePath } from "./name-tokens-api.routes";
import registrarActionsApi from "./registrar-actions-api";
import { basePath as registrarActionsBasePath } from "./registrar-actions-api.routes";
import resolutionApi from "./resolution-api";
import { basePath as resolutionBasePath } from "./resolution-api.routes";

const app = createApp();

app.openapi(configGetMeta, async (c) => {
  const config = (await import("@/config")).default;
  const ensApiPublicConfig = buildEnsApiPublicConfig(config);
  return c.json(serializeENSApiPublicConfig(ensApiPublicConfig));
});

app.openapi(indexingStatusGetMeta, async (c) => {
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
app.route(nameTokensBasePath.replace(basePath, ""), nameTokensApi);

// Registrar Actions API
app.route(registrarActionsBasePath.replace(basePath, ""), registrarActionsApi);

// Resolution API
app.route(resolutionBasePath.replace(basePath, ""), resolutionApi);

// ENSNode GraphQL API
app.route("/graphql", ensnodeGraphQLApi);

export default app;
