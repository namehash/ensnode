import config from "@/config";
import { errorResponse } from "@/lib/handlers/error-response";
import { factory } from "@/lib/hono-factory";
import { ENSIndexerPublicConfig, ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({ url: config.ensIndexerUrl });

let promise: Promise<ENSIndexerPublicConfig>;
const fetchEnsIndexerPublicConfig = async () => {
  if (!promise) {
    console.log("client.config()");
    promise = client.config();
  }
  return promise;
};

export type EnsIndexerPublicConfigVariables = {
  ensIndexerPublicConfig: ENSIndexerPublicConfig;
};

export const ensIndexerPublicConfigMiddleware = factory.createMiddleware(async (c, next) => {
  try {
    const ensIndexerPublicConfig = await fetchEnsIndexerPublicConfig();

    // TODO: invariant that checks that namespace matches config.namespace
    if (ensIndexerPublicConfig.namespace !== config.namespace) {
      throw new Error(
        `Invariant: ENSAPI must use the same NAMESPACE as the connected ENSIndexer. ENSAPI: ${config.namespace}, ENSIndexer: ${ensIndexerPublicConfig.namespace}.`,
      );
    }

    c.set("ensIndexerPublicConfig", ensIndexerPublicConfig);

    return await next();
  } catch (error) {
    console.error(error);
    return errorResponse(c, "Unable to Fetch ENSIndexer /api/config");
  }
});
