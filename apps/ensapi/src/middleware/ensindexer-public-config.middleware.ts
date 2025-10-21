import packageJson from "@/../package.json" with { type: "json" };

import pMemoize from "p-memoize";
import pRetry from "p-retry";

import config from "@/config";
import { errorResponse } from "@/lib/handlers/error-response";
import { factory } from "@/lib/hono-factory";
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

// NOTE: no arguments means memoized for lifetime of process
const fetcher = pMemoize(async () =>
  pRetry(
    async () => {
      const config = await client.config();
      // TODO: pretty-print ensindexer public config
      console.log(
        `ENSAPI successfully connected to ENSIndexer with config: ${JSON.stringify(config, null, 2)}`,
      );
      return config;
    },
    {
      retries: 3,
      onFailedAttempt: ({ error, attemptNumber, retriesLeft, retriesConsumed }) => {
        console.log(
          `Fetch client.config() attempt ${attemptNumber} failed. ${retriesLeft} retries left. ${retriesConsumed} retries consumed.`,
        );
      },
    },
  ),
);

export type EnsIndexerPublicConfigVariables = {
  ensIndexerPublicConfig: Awaited<ReturnType<typeof fetcher>>;
};

export const ensIndexerPublicConfigMiddleware = factory.createMiddleware(async (c, next) => {
  try {
    const ensIndexerPublicConfig = await fetcher();

    // Invariant: ENSAPI & ENSIndexer must match namespace
    if (ensIndexerPublicConfig.namespace !== config.namespace) {
      throw new Error(
        `Invariant: ENSAPI must use the same NAMESPACE as the connected ENSIndexer. ENSAPI: ${config.namespace}, ENSIndexer: ${ensIndexerPublicConfig.namespace}.`,
      );
    }

    // Invariant: ENSAPI & ENSDB must match version numbers
    if (ensIndexerPublicConfig.versionInfo.ensDb !== packageJson.version) {
      throw new Error(
        `Version Mismatch: ENSDB@${ensIndexerPublicConfig.versionInfo.ensDb} !== ENSAPI@${packageJson.version}`,
      );
    }

    // Invariant: ENSAPI & ENSIndexer must match version numbers
    if (ensIndexerPublicConfig.versionInfo.ensIndexer !== packageJson.version) {
      throw new Error(
        `Version Mismatch: ENSIndexer@${ensIndexerPublicConfig.versionInfo.ensIndexer} !== ENSAPI@${packageJson.version}`,
      );
    }

    // Invariant: ENSAPI & ENSRainbow must match version numbers
    if (ensIndexerPublicConfig.versionInfo.ensRainbow !== packageJson.version) {
      throw new Error(
        `Version Mismatch: ENSRainbow@${ensIndexerPublicConfig.versionInfo.ensRainbow} !== ENSAPI@${packageJson.version}`,
      );
    }

    c.set("ensIndexerPublicConfig", ensIndexerPublicConfig);
  } catch (error) {
    console.error("Cannot connnect to ENSIndexer");
    console.error(error);
    return errorResponse(c, "Internal Server Error: ENSIndexer Unavailable");
  }

  return await next();
});
