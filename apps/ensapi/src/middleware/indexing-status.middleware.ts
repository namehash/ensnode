import pMemoize from "p-memoize";
import pReflect from "p-reflect";
import pRetry from "p-retry";

import config from "@/config";
import { factory } from "@/lib/hono-factory";
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

// TODO: memoize with expiry-map and ttl
const fetcher = pMemoize(async () =>
  pReflect(
    pRetry(() => client.indexingStatus(), {
      retries: 3,
      onFailedAttempt: ({ error, attemptNumber, retriesLeft, retriesConsumed }) => {
        console.log(
          `Fetch client.indexingStatus() attempt ${attemptNumber} failed. ${retriesLeft} retries left. ${retriesConsumed} retries consumed.`,
        );
        console.error(error);
      },
    }),
  ),
);

export type IndexingStatusVariables = {
  indexingStatus: Awaited<ReturnType<typeof fetcher>>;
};

export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  c.set("indexingStatus", await fetcher());
  await next();
});
