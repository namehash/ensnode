import { Client, fetchExchange } from "@urql/core";
import { cacheExchange } from "@urql/exchange-graphcache";
import { schema } from "enssdk/omnigraph";
import { introspectionFromSchema } from "graphql";

export function createOmnigraphUrqlClient(ensNodeUrl: string): Client {
  const url = new URL("/api/omnigraph", ensNodeUrl).href;

  return new Client({
    url,
    exchanges: [
      cacheExchange({ schema: introspectionFromSchema(schema) }), //
      fetchExchange,
    ],
  });
}
