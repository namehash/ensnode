import type { TadaDocumentNode } from "gql.tada";
import type { DocumentNode } from "graphql";
import { print } from "graphql";

import type { ENSSDKClient } from "../core/index";

export type { FragmentOf, ResultOf, VariablesOf } from "./graphql";
export { graphql, readFragment } from "./graphql";

type GraphQLDocument<R = unknown, V = unknown> = string | DocumentNode | TadaDocumentNode<R, V>;

type QueryOptions<R, V extends Record<string, unknown> | undefined> = {
  query: GraphQLDocument<R, V>;
  variables?: V;
  signal?: AbortSignal;
};

type QueryResult<R> = {
  data?: R;
  errors?: Array<{
    message: string;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
};

export interface OmnigraphModule {
  omnigraph: {
    query<R, V extends Record<string, unknown> | undefined = undefined>(
      options: QueryOptions<R, V>,
    ): Promise<QueryResult<R>>;
  };
}

export function omnigraph(client: ENSSDKClient): OmnigraphModule {
  const { config } = client;
  const _fetch = config.fetch ?? globalThis.fetch;
  const endpoint = new URL("/api/omnigraph", config.url).href;

  return {
    omnigraph: {
      async query<R, V extends Record<string, unknown> | undefined>(
        opts: QueryOptions<R, V>,
      ): Promise<QueryResult<R>> {
        const response = await _fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: typeof opts.query === "string" ? opts.query : print(opts.query),
            variables: opts.variables,
          }),
          signal: opts.signal,
        });

        return response.json() as Promise<QueryResult<R>>;
      },
    },
  };
}
