import config from "@/config";
import { ENSIndexerPublicConfig, ENSNodeClient } from "@ensnode/ensnode-sdk";
import { createMiddleware } from "hono/factory";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

let promise: Promise<ENSIndexerPublicConfig>;
const fetchConfig = async () => {
  if (!promise) promise = client.config();
  return promise;
};

export const ensIndexerPublicConfigMiddleware = createMiddleware<{
  Variables: {
    config: ENSIndexerPublicConfig;
  };
}>(async (c, next) => {
  c.set("config", await fetchConfig());

  return await next();
});
