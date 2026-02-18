import type { EnsApiPublicConfig } from "../../config/types";

/**
 * ENSApi Public Config Response
 */
export type EnsApiConfigResponse = EnsApiPublicConfig;

/**
 * ENSApi Config API Response
 *
 * @deprecated Use {@link EnsApiConfigResponse} instead.
 */
export type ConfigResponse = EnsApiConfigResponse;
