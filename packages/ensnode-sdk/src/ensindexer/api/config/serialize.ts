import { serializeEnsIndexerPublicConfig } from "../../config/serialize";
import type { EnsIndexerConfigResponse } from "./response";
import type { SerializedEnsIndexerConfigResponse } from "./serialized-response";

export function serializeEnsIndexerConfigResponse(
  response: EnsIndexerConfigResponse,
): SerializedEnsIndexerConfigResponse {
  return serializeEnsIndexerPublicConfig(response);
}
