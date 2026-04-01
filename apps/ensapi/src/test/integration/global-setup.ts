import { client, ENSNODE_OMNIGRAPH_API_URL, gql } from "./omnigraph-api-client";

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
      `Integration test health check failed: could not reach ${ENSNODE_OMNIGRAPH_API_URL}. ` +
        `Ensure ensapi is running before running integration tests.\n` +
        `Original error: ${error}`,
    );
  }
}
