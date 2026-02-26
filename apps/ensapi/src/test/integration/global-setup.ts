import { client, gql } from "./ensnode-graphql-api-client";

const ENSAPI_GRAPHQL_URL = process.env.ENSAPI_GRAPHQL_API_URL ?? "http://localhost:4334/api/graphql";

export async function setup() {
  try {
    await client.request(gql`
      {
        __schema {
          queryType {
            name
          }
        }
      }
    `);
  } catch (error) {
    throw new Error(
      `Integration test health check failed: could not reach ${ENSAPI_GRAPHQL_URL}. ` +
        `Ensure ensapi is running before running integration tests.\n` +
        `Original error: ${error}`,
    );
  }
}
