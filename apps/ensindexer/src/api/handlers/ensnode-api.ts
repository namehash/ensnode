import { publicClients } from "ponder:api";
import {
  IndexingStatusResponseCodes,
  OverallIndexingStatusIds,
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { routes } from "@ensnode/ensnode-sdk/internal";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import { validate } from "@/api/lib/handlers/validate";
import { buildIndexingStatus, hasAchievedRequestedDistance } from "@/api/lib/indexing-status";
import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { getUnixTime } from "date-fns";
import type { UnofficialStatusCode } from "hono/utils/http-status";
import resolutionApi from "./resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

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

// Resolution API
app.route("/resolve", resolutionApi);

export default app;
