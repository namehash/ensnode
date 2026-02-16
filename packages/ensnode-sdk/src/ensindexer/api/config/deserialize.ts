import type { Unvalidated } from "../../../shared/types";
import { deserializeENSIndexerPublicConfig } from "../../config/deserialize";
import type { ConfigResponse } from "./response";
import type { SerializedConfigResponse } from "./serialized-response";

/**
 * Deserialize a {@link ConfigResponse} object.
 */
export function deserializeConfigResponse(
  serializedResponse: Unvalidated<SerializedConfigResponse>,
): ConfigResponse {
  return deserializeENSIndexerPublicConfig(serializedResponse);
}
