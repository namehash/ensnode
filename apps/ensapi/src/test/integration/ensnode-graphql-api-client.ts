import { GraphQLClient } from "graphql-request";

export { gql } from "graphql-request";

export const ENSAPI_GRAPHQL_API_URL =
  process.env.ENSAPI_GRAPHQL_API_URL ?? "http://localhost:4334/api/graphql";

export const client = new GraphQLClient(ENSAPI_GRAPHQL_API_URL);
