import { deserializeEnsApiPublicConfig } from "../../config/deserialize";
import type { EnsApiConfigResponse } from "./response";
import type { SerializedEnsApiConfigResponse } from "./serialized-response";

/**
 * Deserialize a {@link EnsApiConfigResponse} object.
 */
export function deserializeEnsApiConfigResponse(
  serializedResponse: SerializedEnsApiConfigResponse,
): EnsApiConfigResponse {
  return deserializeEnsApiPublicConfig(serializedResponse);
}

/**
 * Deserialize a {@link EnsApiConfigResponse} object.
 *
 * @deprecated Use {@link deserializeEnsApiConfigResponse} instead.
 */
export const deserializeConfigResponse = deserializeEnsApiConfigResponse;
