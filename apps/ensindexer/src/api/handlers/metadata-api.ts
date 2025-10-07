import packageJson from "@/../package.json";

import { db, publicClients } from "ponder:api";
import config from "@/config";

import {
  fetchEnsRainbowVersion,
  fetchFirstBlockToIndexByChainId,
  fetchPonderStatus,
  fetchPrometheusMetrics,
} from "@/lib/ponder-metadata-provider";
import { ponderMetadata } from "@ensnode/ponder-metadata";

import { Hono } from "hono";

const app = new Hono();

app.get(
  ponderMetadata({
    app: {
      name: packageJson.name,
      version: packageJson.version,
    },
    env: {
      PLUGINS: config.plugins.join(","),
      DATABASE_SCHEMA: config.databaseSchemaName,
      NAMESPACE: config.namespace,
    },
    db,
    query: {
      firstBlockToIndexByChainId: fetchFirstBlockToIndexByChainId,
      prometheusMetrics: fetchPrometheusMetrics,
      ensRainbowVersion: fetchEnsRainbowVersion,
      ponderStatus: fetchPonderStatus,
    },
    publicClients,
  }),
);

export default app;
