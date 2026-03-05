import { GraphQLClient } from "graphql-request";

export { gql } from "graphql-request";

export const ENSNODE_GRAPHQL_API_URL = `${process.env.ENSNODE_URL || "http://localhost:4334"}/api/graphql`;

export const client = new GraphQLClient(ENSNODE_GRAPHQL_API_URL);
