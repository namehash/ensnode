import pMemoize from "p-memoize";
import pRetry from "p-retry";

import config from "@/config";
import { errorResponse } from "@/lib/handlers/error-response";
import { factory } from "@/lib/hono-factory";
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

// NOTE: no arguments means memoized for lifetime of process
const fetcher = pMemoize(async () =>
  pRetry(() => client.config(), {
    retries: 3,
    onFailedAttempt: ({ error, attemptNumber, retriesLeft, retriesConsumed }) => {
      console.log(
        `Fetch client.config() attempt ${attemptNumber} failed. ${retriesLeft} retries left. ${retriesConsumed} retries consumed.`,
      );
      console.error(error);
    },
  }),
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

    c.set("ensIndexerPublicConfig", ensIndexerPublicConfig);
  } catch (error) {
    console.error(`Unable to fetch ENSIndexer's Config: ${error}`);
    return errorResponse(c, "Unable to fetch ENSIndexer's Config");
  }

  return await next();
});
