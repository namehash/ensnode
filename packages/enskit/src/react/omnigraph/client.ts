import { Client, fetchExchange } from "@urql/core";

import { omnigraphCacheExchange } from "./lib/cache-exchange";

export function createOmnigraphUrqlClient(ensNodeUrl: string): Client {
  const url = new URL("/api/omnigraph", ensNodeUrl).href;

  return new Client({
    url,
    exchanges: [omnigraphCacheExchange, fetchExchange],
  });
}
