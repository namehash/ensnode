import type {
  DatabaseEnvironment,
  EnsHolidayAwardsEnvironment,
  EnsIndexerUrlEnvironment,
  LogLevelEnvironment,
  PortEnvironment,
  RpcEnvironment,
  TheGraphEnvironment,
} from "@ensnode/ensnode-sdk/internal";

/**
 * Environment variables for OpenAPI generation mode.
 *
 * When OPENAPI_GENERATE_MODE is set to "true":
 *
 * **Startup behavior:**
 * - ENSApi starts with a minimal mock configuration, bypassing the need for
 *   external dependencies like a database, ENSIndexer, or RPC connections.
 *
 * **Request handling:**
 * - All routes return HTTP 503 Service Unavailable EXCEPT for `/openapi.json`
 * - Only the `/openapi.json` endpoint is functional and returns the OpenAPI spec
 *
 * **Environment variables ignored** (mock values used instead):
 * - DATABASE_URL
 * - ENSINDEXER_URL
 * - THEGRAPH_API_KEY
 * - All RPC configuration variables (ALCHEMY_API_KEY, QUICKNODE_API_KEY,
 *   QUICKNODE_ENDPOINT_NAME, DRPC_API_KEY, RPC_URL_*)
 * - ENS_HOLIDAY_AWARDS_START
 * - ENS_HOLIDAY_AWARDS_END
 *
 * **Environment variables still respected:**
 * - PORT
 * - LOG_LEVEL
 */
export interface OpenApiGenerateModeEnvironment {
  OPENAPI_GENERATE_MODE?: string;
}

/**
 * Represents the raw, unvalidated environment variables for the ENSApi application.
 *
 * Keys correspond to the environment variable names, and all values are optional strings, reflecting
 * their state in `process.env`. This interface is intended to be the source type which then gets
 * mapped/parsed into a structured configuration object like `EnsApiConfig`.
 */
export type EnsApiEnvironment = Omit<DatabaseEnvironment, "DATABASE_SCHEMA"> &
  EnsIndexerUrlEnvironment &
  RpcEnvironment &
  PortEnvironment &
  LogLevelEnvironment &
  TheGraphEnvironment &
  EnsHolidayAwardsEnvironment &
  OpenApiGenerateModeEnvironment;
