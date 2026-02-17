import type { z } from "zod/v4";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import type { PortNumber } from "@ensnode/ensnode-sdk/internal";

import type { AbsolutePathSchemaBase, DbSchemaVersionSchemaBase } from "./config.schema";

/**
 * Absolute filesystem path.
 * Inferred from {@link AbsolutePathSchemaBase} - see that schema for invariants.
 */
export type AbsolutePath = z.infer<typeof AbsolutePathSchemaBase>;

/**
 * Database schema version number.
 * Inferred from {@link DbSchemaVersionSchemaBase} - see that schema for invariants.
 */
export type DbSchemaVersion = z.infer<typeof DbSchemaVersionSchemaBase>;

/**
 * Configuration derived from environment variables for ENSRainbow.
 */
export interface ENSRainbowEnvConfig {
  port: PortNumber;
  dataDir: AbsolutePath;
  dbSchemaVersion: DbSchemaVersion;
}

/**
 * Validated configuration for the serve command.
 */
export interface ServeCommandConfig {
  port: PortNumber;
  dataDir: AbsolutePath;
}

/**
 * Metadata read from an opened ENSRainbow database.
 */
export interface DbConfig {
  labelSet: EnsRainbowServerLabelSet;
  recordsCount: number;
}
