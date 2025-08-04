import { publicClients } from "ponder:api";
import config from "@/config";
import {
  DEFAULT_METRICS_FETCH_TIMEOUT,
  buildIndexingStatus,
  fetchChainsBlockRefs,
  fetchPonderMetrics,
  fetchPonderStatus,
  indexedChainsBlockrange,
} from "@/indexing-status";
import {
  serializeENSIndexerIndexingStatus,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";
import resolutionApi from "../lib/resolution-api";

/**
 * ENSIndexer cannot start before all block refs for every indexed chain are known.
 * The block refs must be fetched before the {@link DEFAULT_METRICS_FETCH_TIMEOUT} timeout occurs.
 * Otherwise, the ENSIndexer process must crash.
 */
export const indexedChainsBlockRefs = fetchChainsBlockRefs(
  config.ensIndexerPrivateUrl,
  indexedChainsBlockrange,
  publicClients,
).catch((error) => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error(`Terminating ENSNode instance: ${errorMessage}`);
  process.exit(1);
});

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

// include ENSIndexer Public Config endpoint
app.get("/config", (c) => c.json(serializeENSIndexerPublicConfig(config)));

// include ENSIndexer Indexing Status endpoint
app.get("/indexing-status", async (c) => {
  // Get current Ponder metadata
  const [metrics, status, chainsBlockRefs] = await Promise.all([
    fetchPonderMetrics(config.ensIndexerPrivateUrl),
    fetchPonderStatus(config.ensIndexerPrivateUrl),
    indexedChainsBlockRefs,
  ]);

  // Validate Ponder metadata and enforce invariants, then build IndexingStatus object.
  const indexingStatus = await buildIndexingStatus({
    metrics,
    status,
    chainsBlockRefs,
  });

  return c.json(serializeENSIndexerIndexingStatus(indexingStatus));
});

// conditionally include experimental resolution api
if (config.experimentalResolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
