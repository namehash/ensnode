import { getUnixTime } from "date-fns";
import { Hono } from "hono";

import {
  createRealtimeIndexingStatusProjection,
  EnsIndexerIndexingStatusResponseCodes,
  type EnsIndexerIndexingStatusResponseError,
  type EnsIndexerIndexingStatusResponseOk,
  IndexingMetadataContextStatusCodes,
  serializeEnsIndexerIndexingStatusResponse,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { ensDbClient } from "@/lib/ensdb/singleton";
import { logger } from "@/lib/logger";

const app = new Hono();

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  const indexingMetadataContext = await ensDbClient.getIndexingMetadataContext();

  // Invariant: the public config is guaranteed to be available in ENSDb after
  // application startup.
  if (indexingMetadataContext.statusCode !== IndexingMetadataContextStatusCodes.Initialized) {
    throw new Error("Unreachable: ENSIndexer Public Config is not available in ENSDb");
  }

  // respond with the serialized public config object
  return c.json(serializeEnsIndexerPublicConfig(indexingMetadataContext.stackInfo.ensIndexer));
});

app.get("/indexing-status", async (c) => {
  try {
    const indexingMetadataContext = await ensDbClient.getIndexingMetadataContext();

    // Invariant: the Indexing Status Snapshot is expected to be available in
    // ENSDb shortly after application startup. There is a possibility that
    // the snapshot is not yet available at the time of the request,
    // i.e. when ENSDb has not yet been populated with the first snapshot.
    // In this case, we treat the snapshot as unavailable and respond with
    // an error response.
    if (indexingMetadataContext.statusCode !== IndexingMetadataContextStatusCodes.Initialized) {
      throw new Error("ENSDb does not contain an Indexing Status Snapshot");
    }

    const crossChainSnapshot = indexingMetadataContext.indexingStatus;
    const projectedAt = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(
      crossChainSnapshot,
      projectedAt,
    );

    return c.json(
      serializeEnsIndexerIndexingStatusResponse({
        responseCode: EnsIndexerIndexingStatusResponseCodes.Ok,
        realtimeProjection,
      } satisfies EnsIndexerIndexingStatusResponseOk),
    );
  } catch (error) {
    logger.error({
      msg: "Indexing status snapshot unavailable",
      error,
      module: "ensnode-api",
      endpoint: "/indexing-status",
    });

    return c.json(
      serializeEnsIndexerIndexingStatusResponse({
        responseCode: EnsIndexerIndexingStatusResponseCodes.Error,
      } satisfies EnsIndexerIndexingStatusResponseError),
      500,
    );
  }
});

export default app;
