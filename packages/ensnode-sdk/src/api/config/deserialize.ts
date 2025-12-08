import { deserializeENSApiPublicConfig } from "../../ensapi";
import type { ConfigResponse } from "./response";
import type { SerializedConfigResponse } from "./serialized-response";

/**
 * Deserialize a {@link ConfigResponse} object.
 */
export function deserializeConfigResponse(
  serializedResponse: SerializedConfigResponse,
): ConfigResponse {
  return deserializeENSApiPublicConfig(serializedResponse);
}
