import { publicClients } from "ponder:api";
import config from "@/config";
import { getUnixTime } from "date-fns";
import { Hono } from "hono";
import type { UnofficialStatusCode } from "hono/utils/http-status";

import {
  IndexingStatusResponseCodes,
  OverallIndexingStatusIds,
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { routes, validate } from "@ensnode/ensnode-sdk/internal";

import { buildENSIndexerPublicConfig } from "@/config/public";
import { buildIndexingStatus } from "@/lib/api/indexing-status/build-index-status";
import { hasAchievedRequestedDistance } from "@/lib/api/indexing-status/realtime-indexing-distance";

const app = new Hono();

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // prepare the public config object, including dependency info
  const publicConfig = await buildENSIndexerPublicConfig(config);

  // respond with the serialized public config object
  return c.json(serializeENSIndexerPublicConfig(publicConfig));
});

app.get("/indexing-status", validate("query", routes.indexingStatus.query), async (c) => {
  const { maxRealtimeDistance } = c.req.valid("query");

  // get system timestamp for the current request
  const systemTimestamp = getUnixTime(new Date());

  const indexingStatus = await buildIndexingStatus(publicClients, systemTimestamp);
  const serializedIndexingStatus = serializeENSIndexerIndexingStatus(indexingStatus);

  // respond with custom server error if ENSIndexer is not available
  if (indexingStatus.overallStatus === OverallIndexingStatusIds.IndexerError) {
    return c.json(
      serializedIndexingStatus,
      IndexingStatusResponseCodes.IndexerError as UnofficialStatusCode,
    );
  }

  const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
    indexingStatus,
    maxRealtimeDistance,
  );

  // respond with custom server error if requested distance hasn't been achieved yet
  if (!hasAchievedRequestedRealtimeIndexingDistance) {
    return c.json(
      serializedIndexingStatus,
      IndexingStatusResponseCodes.RequestedDistanceNotAchievedError as UnofficialStatusCode,
    );
  }

  // respond with the serialized indexing status object
  return c.json(serializedIndexingStatus);
});

export default app;
