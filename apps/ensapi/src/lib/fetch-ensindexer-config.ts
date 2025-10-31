import {
  deserializeENSIndexerPublicConfig,
  deserializeErrorResponse,
  type SerializedENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

export async function fetchENSIndexerConfig(url: URL) {
  const response = await fetch(new URL(`/api/config`, url));
  const responseData = await response.json();

  if (!response.ok) {
    const errorResponse = deserializeErrorResponse(responseData);
    throw new Error(`Fetching ENSNode Config Failed: ${errorResponse.message}`);
  }

  return deserializeENSIndexerPublicConfig(responseData as SerializedENSIndexerPublicConfig);
}
