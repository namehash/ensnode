import packageJson from "@/../package.json" with { type: "json" };

import { isAbsolute, resolve } from "node:path";

import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema, PortSchema } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";
import { invariant_dbSchemaVersionMatch } from "@/config/validations";
import { logger } from "@/utils/logger";

const DataDirSchema = z
  .string()
  .trim()
  .min(1, {
    error: "DATA_DIR must be a non-empty string.",
  })
  .transform((path: string) => {
    // Resolve relative paths to absolute paths (cross-platform)
    if (isAbsolute(path)) {
      return path;
    }
    return resolve(process.cwd(), path);
  });

const DbSchemaVersionSchema = z.coerce
  .number({ error: "DB_SCHEMA_VERSION must be a number." })
  .int({ error: "DB_SCHEMA_VERSION must be an integer." })
  .optional();

const LabelSetSchema = makeFullyPinnedLabelSetSchema("LABEL_SET");

const ENSRainbowConfigSchema = z
  .object({
    port: PortSchema.default(ENSRAINBOW_DEFAULT_PORT),
    dataDir: DataDirSchema.default(getDefaultDataDir()),
    dbSchemaVersion: DbSchemaVersionSchema,
    labelSet: LabelSetSchema.optional(),
  })
  /**
   * Invariant enforcement
   *
   * We enforce invariants across multiple values parsed with `ENSRainbowConfigSchema`
   * by calling `.check()` function with relevant invariant-enforcing logic.
   * Each such function has access to config values that were already parsed.
   */
  .check(invariant_dbSchemaVersionMatch);

export type ENSRainbowConfig = z.infer<typeof ENSRainbowConfigSchema>;

/**
 * Builds the ENSRainbow configuration object from an ENSRainbowEnvironment object.
 *
 * Validates and parses the complete environment configuration using ENSRainbowConfigSchema.
 *
 * @returns A validated ENSRainbowConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(env: ENSRainbowEnvironment): ENSRainbowConfig {
  try {
    return ENSRainbowConfigSchema.parse({
      port: env.PORT,
      dataDir: env.DATA_DIR,
      dbSchemaVersion: env.DB_SCHEMA_VERSION,
      labelSet:
        env.LABEL_SET_ID || env.LABEL_SET_VERSION
          ? {
              labelSetId: env.LABEL_SET_ID,
              labelSetVersion: env.LABEL_SET_VERSION,
            }
          : undefined,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
    } else if (error instanceof Error) {
      logger.error(error, `Failed to build ENSRainbowConfig`);
    } else {
      logger.error(`Unknown Error`);
    }

    process.exit(1);
  }
}

/**
 * Builds the ENSRainbow public configuration from an ENSRainbowConfig object and server state.
 *
 * @param config - The validated ENSRainbowConfig object
 * @param labelSet - The label set managed by the ENSRainbow server
 * @param recordsCount - The total count of records managed by the ENSRainbow service
 * @returns A complete ENSRainbowPublicConfig object
 */
export function buildENSRainbowPublicConfig(
  config: ENSRainbowConfig,
  labelSet: EnsRainbowServerLabelSet,
  recordsCount: number,
): EnsRainbow.ENSRainbowPublicConfig {
  return {
    version: packageJson.version,
    labelSet,
    recordsCount,
  };
}
