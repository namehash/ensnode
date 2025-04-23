import {
  type SavedQuery,
  savedQueriesPlugin,
} from "@/components/graphiql-plugin-saved-queries/src";

export const queries: SavedQuery[] = [
  {
    operationName: "getDomains",
    id: "1",
    name: "Get Domains",
    query: /* GraphQL */ `
      query getDomains {
        domains {
          items {
            id
            name
          }
        }
      }
    `,
  },
];

export const savedQueries = savedQueriesPlugin({
  queries,
});
