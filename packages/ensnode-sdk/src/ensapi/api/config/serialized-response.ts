import type { SerializedEnsApiPublicConfig } from "../../config/serialized-types";
import type { EnsApiConfigResponse } from "./response";

/**
 * Serialized representation of {@link EnsApiConfigResponse}
 */
export type SerializedEnsApiConfigResponse = SerializedEnsApiPublicConfig;

/**
 * @deprecated Use {@link SerializedEnsApiConfigResponse} instead.
 */
export type SerializedConfigResponse = SerializedEnsApiConfigResponse;
