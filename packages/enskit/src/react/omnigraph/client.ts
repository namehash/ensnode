import { Client, fetchExchange } from "@urql/core";
import type { EnsNodeClientConfig } from "enssdk/core";

import { omnigraphCacheExchange } from "./_lib/cache-exchange";

export function createOmnigraphUrqlClient(config: EnsNodeClientConfig) {
  return new Client({
    url: new URL("/api/omnigraph", config.url).href,
    fetch: config.fetch,
    exchanges: [omnigraphCacheExchange, fetchExchange],
  });
}
