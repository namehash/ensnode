import { serializeEnsApiPublicConfig } from "../../config/serialize";
import type { EnsApiConfigResponse } from "./response";
import type { SerializedEnsApiConfigResponse } from "./serialized-response";

/**
 * Serialize ENSApi Config API Response
 */
export function serializeEnsApiConfigResponse(
  response: EnsApiConfigResponse,
): SerializedEnsApiConfigResponse {
  return serializeEnsApiPublicConfig(response);
}

/**
 * Serialize ENSApi Config API Response
 *
 * @deprecated Use {@link serializeEnsApiConfigResponse} instead.
 */
export const serializeConfigResponse = serializeEnsApiConfigResponse;
