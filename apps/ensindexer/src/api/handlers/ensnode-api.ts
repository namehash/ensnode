import config from "@/config";
import { Hono } from "hono";

import { RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import * as realtimeIndexingStatus from "../lib/realtime-indexing-status";
import resolutionApi from "../lib/resolution-api";

const app = new Hono();

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

// realtime indexing status monitoring endpoint
app.get("/amirealtime", async (c) => {
  // 0. unpack the `realtimeIndexingStatus` module API
  const {
    createRequest,
    createResponse,
    getCurrentDate,
    getPonderStatus,
    getRealtimeIndexingStatus,
  } = realtimeIndexingStatus;

  // 1. parse request data
  let request: RealtimeIndexingStatusMonitoring.Request;

  try {
    request = createRequest({
      maxAllowedIndexingLag: c.req.query("maxAllowedIndexingLag"),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return c.text(errorMessage, 400);
  }

  // 2. arrange dependencies
  const maxAllowedIndexingLag = request.maxAllowedIndexingLag;
  const currentDate = getCurrentDate();
  const ponderStatus = await getPonderStatus();

  // 3. get the current indexing status
  const indexingStatus = getRealtimeIndexingStatus({
    maxAllowedIndexingLag,
    currentDate,
    ponderStatus,
  });

  // 4. set appropriate HTTP status
  if (indexingStatus.hasAchievedRequestedRealtimeIndexingGap) {
    // if the requested realtime indexing gap has been achieved
    // set HTTP status to `200`
    c.status(200);
  } else {
    // otherwise, set HTTP status to 503
    c.status(503);
  }

  // 5. prepare response
  const response = createResponse({
    indexingStatus,
    maxAllowedIndexingLag,
  });

  // 6. send response
  return c.json(response);
});

export default app;
