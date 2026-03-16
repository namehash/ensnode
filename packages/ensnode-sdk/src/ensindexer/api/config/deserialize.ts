import type { Unvalidated } from "../../../shared/types";
import { deserializeEnsIndexerPublicConfig } from "../../config/deserialize";
import type { EnsIndexerConfigResponse } from "./response";
import type { SerializedEnsIndexerConfigResponse } from "./serialized-response";

/**
 * Deserialize value into {@link EnsIndexerConfigResponse} object.
 */
export function deserializeEnsIndexerConfigResponse(
  maybeResponse: Unvalidated<SerializedEnsIndexerConfigResponse>,
): EnsIndexerConfigResponse {
  return deserializeEnsIndexerPublicConfig(maybeResponse, "EnsIndexerConfigResponse");
}
