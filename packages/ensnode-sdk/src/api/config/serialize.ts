import { serializeENSApiPublicConfig } from "../../ensapi";
import type { ConfigResponse } from "./response";
import type { SerializedConfigResponse } from "./serialized-response";

export function serializeConfigResponse(response: ConfigResponse): SerializedConfigResponse {
  return serializeENSApiPublicConfig(response);
}
