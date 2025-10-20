import config from "@/config";
import { factory } from "@/lib/hono-factory";
import { ENSNodeClient, IndexingStatusResponse } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

export type IndexingStatusVariables = {
  indexingStatus: IndexingStatusResponse;
};

export const indexingStatusMiddleware = factory.createMiddleware(async (c, next) => {
  // TODO: intelligent caching/de-duplication
  const indexingStatus = await client.indexingStatus();
  c.set("indexingStatus", indexingStatus);

  return await next();
});
