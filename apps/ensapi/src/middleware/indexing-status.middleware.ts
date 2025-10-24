import pMemoize from "p-memoize";
import pReflect from "p-reflect";

import config from "@/config";
import { factory } from "@/lib/hono-factory";
import { ENSNodeClient, TtlCache } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

const TTL_MS = 5_000; // 5 seconds

// memoizes the reflected indexing-status-with-retries promise across TTL_MS
const fetcher = pMemoize(async () => pReflect(client.indexingStatus()), {
  cache: new TtlCache(TTL_MS),
});

export type IndexingStatusVariables = {
  indexingStatus: Awaited<ReturnType<typeof fetcher>>;
};

export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  c.set("indexingStatus", await fetcher());
  await next();
});
