import { Client, fetchExchange } from "@urql/core";
import type { EnsNodeClientConfig } from "enssdk/core";

import { omnigraphCacheExchange } from "./lib/cache-exchange";

export function createOmnigraphUrqlClient(config: EnsNodeClientConfig): Client {
  const url = new URL("/api/omnigraph", config.url).href;

  return new Client({
    url,
    fetch: config.fetch,
    exchanges: [omnigraphCacheExchange, fetchExchange],
  });
}
