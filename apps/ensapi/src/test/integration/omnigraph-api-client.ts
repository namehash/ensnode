import { GraphQLClient } from "graphql-request";

export { gql } from "graphql-request";

// biome-ignore lint/style/noNonNullAssertion: always available in integration tests
export const ENSNODE_OMNIGRAPH_API_URL = new URL("/api/omnigraph", process.env.ENSNODE_URL!).href;

export const client = new GraphQLClient(ENSNODE_OMNIGRAPH_API_URL);
