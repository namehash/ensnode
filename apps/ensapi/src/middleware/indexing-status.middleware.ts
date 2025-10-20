import config from "@/config";
import { ENSNodeClient, IndexingStatusResponse } from "@ensnode/ensnode-sdk";
import { createMiddleware } from "hono/factory";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });
export const indexingStatusMiddleware = createMiddleware<{
  Variables: {
    indexingStatus: IndexingStatusResponse;
  };
}>(async (c, next) => {
  const indexingStatus = await client.indexingStatus();
  c.set("indexingStatus", indexingStatus);

  return await next();
});
