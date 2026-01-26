import packageJson from "@/../package.json" with { type: "json" };

import { isAbsolute, resolve } from "node:path";

import { ZodError, z } from "zod/v4";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema, PortSchema } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";
import { invariant_dbSchemaVersionMatch } from "@/config/validations";

/**
 * Validates and extracts label set configuration from environment variables.
 *
 * Both LABEL_SET_ID and LABEL_SET_VERSION must be provided together, or neither should be set.
 *
 * @param labelSetId - The raw LABEL_SET_ID environment variable
 * @param labelSetVersion - The raw LABEL_SET_VERSION environment variable
 * @returns The validated label set configuration object, or undefined if neither is set
 * @throws Error if only one of the label set variables is provided
 */
function validateLabelSetConfiguration(
  labelSetId: string | undefined,
  labelSetVersion: string | undefined,
): { labelSetId: string; labelSetVersion: string } | undefined {
  // Validate label set configuration: both must be provided together, or neither
  const hasLabelSetId = labelSetId !== undefined && labelSetId.trim() !== "";
  const hasLabelSetVersion = labelSetVersion !== undefined && labelSetVersion.trim() !== "";

  if (hasLabelSetId && !hasLabelSetVersion) {
    throw new Error(
      `LABEL_SET_ID is set but LABEL_SET_VERSION is missing. Both LABEL_SET_ID and LABEL_SET_VERSION must be provided together, or neither.`,
    );
  }

  if (!hasLabelSetId && hasLabelSetVersion) {
    throw new Error(
      `LABEL_SET_VERSION is set but LABEL_SET_ID is missing. Both LABEL_SET_ID and LABEL_SET_VERSION must be provided together, or neither.`,
    );
  }

  return hasLabelSetId && hasLabelSetVersion
    ? {
        labelSetId,
        labelSetVersion,
      }
    : undefined;
}

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
 * @throws {ZodError} with detailed validation messages if environment parsing fails
 * @throws {Error} if label set configuration is invalid (e.g., only one of LABEL_SET_ID or LABEL_SET_VERSION is provided)
 */
export function buildConfigFromEnvironment(env: ENSRainbowEnvironment): ENSRainbowConfig {
  // Transform environment variables into config shape with validation
  const envToConfigSchema = z
    .object({
      PORT: z.string().optional(),
      DATA_DIR: z.string().optional(),
      DB_SCHEMA_VERSION: z.string().optional(),
      LABEL_SET_ID: z.string().optional(),
      LABEL_SET_VERSION: z.string().optional(),
    })
    .transform((env) => {
      const labelSet = validateLabelSetConfiguration(env.LABEL_SET_ID, env.LABEL_SET_VERSION);

      return {
        port: env.PORT,
        dataDir: env.DATA_DIR,
        dbSchemaVersion: env.DB_SCHEMA_VERSION,
        labelSet,
      };
    });

  const configInput = envToConfigSchema.parse(env);
  return ENSRainbowConfigSchema.parse(configInput);
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
