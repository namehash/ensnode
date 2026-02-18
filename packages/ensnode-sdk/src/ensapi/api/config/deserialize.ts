import type { Unvalidated } from "../../../shared/types";
import { deserializeEnsApiPublicConfig } from "../../config/deserialize";
import type { EnsApiConfigResponse } from "./response";
import type { SerializedEnsApiConfigResponse } from "./serialized-response";

/**
 * Deserialize a {@link EnsApiConfigResponse} object.
 */
export function deserializeEnsApiConfigResponse(
  maybeResponse: Unvalidated<SerializedEnsApiConfigResponse>,
): EnsApiConfigResponse {
  return deserializeEnsApiPublicConfig(maybeResponse);
}

/**
 * Deserialize a {@link EnsApiConfigResponse} object.
 *
 * @deprecated Use {@link deserializeEnsApiConfigResponse} instead.
 */
export const deserializeConfigResponse = deserializeEnsApiConfigResponse;
