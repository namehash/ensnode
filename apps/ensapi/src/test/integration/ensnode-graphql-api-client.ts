import { GraphQLClient } from "graphql-request";

export { gql } from "graphql-request";

export const ENSNODE_GRAPHQL_API_URL = new URL(
  "/api/graphql",
  process.env.ENSNODE_URL || "http://localhost:4334",
).href;

export const client = new GraphQLClient(ENSNODE_GRAPHQL_API_URL);
