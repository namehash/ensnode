import { getUnixTime } from "date-fns";
import { Hono } from "hono";

import {
  buildCrossChainIndexingStatusSnapshotOmnichain,
  createRealtimeIndexingStatusProjection,
  EnsIndexerIndexingStatusResponseCodes,
  type EnsIndexerIndexingStatusResponseError,
  type EnsIndexerIndexingStatusResponseOk,
  serializeEnsIndexerIndexingStatusResponse,
  serializeEnsIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

import { indexingStatusBuilder } from "@/lib/indexing-status-builder/singleton";
import { logger } from "@/lib/logger";
import { publicConfigBuilder } from "@/lib/public-config-builder/singleton";

const app = new Hono();

app.get("/config", async (c) => {
  const ensIndexerPublicConfig = await publicConfigBuilder.getPublicConfig();

  // respond with the serialized public config object
  return c.json(serializeEnsIndexerPublicConfig(ensIndexerPublicConfig));
});

app.get("/indexing-status", async (c) => {
  try {
    const omnichainSnapshot = await indexingStatusBuilder.getOmnichainIndexingStatusSnapshot();

    const now = getUnixTime(new Date());
    const crossChainSnapshot = buildCrossChainIndexingStatusSnapshotOmnichain(
      omnichainSnapshot,
      now,
    );

    const realtimeProjection = createRealtimeIndexingStatusProjection(crossChainSnapshot, now);

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
