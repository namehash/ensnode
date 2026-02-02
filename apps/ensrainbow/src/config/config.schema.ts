import packageJson from "@/../package.json" with { type: "json" };

import { isAbsolute, resolve } from "node:path";

import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema, PortSchema } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";
import type { ENSRainbowConfig } from "@/config/types";
import { invariant_dbSchemaVersionMatch } from "@/config/validations";
import { DB_SCHEMA_VERSION } from "@/lib/database";

export type { ENSRainbowConfig };

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
  .positive({ error: "DB_SCHEMA_VERSION must be greater than 0." })
  .default(DB_SCHEMA_VERSION);

const LabelSetSchema = makeFullyPinnedLabelSetSchema("LABEL_SET");

const ENSRainbowConfigBaseSchema = z.object({
  port: PortSchema.default(ENSRAINBOW_DEFAULT_PORT),
  dataDir: DataDirSchema.default(getDefaultDataDir()),
  dbSchemaVersion: DbSchemaVersionSchema,
  labelSet: LabelSetSchema.optional(),
});

const ENSRainbowConfigSchema = ENSRainbowConfigBaseSchema
  /**
   * Invariant enforcement
   *
   * We enforce invariants across multiple values parsed with `ENSRainbowConfigSchema`
   * by calling `.check()` function with relevant invariant-enforcing logic.
   * Each such function has access to config values that were already parsed.
   */
  .check(invariant_dbSchemaVersionMatch);

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
    // Transform environment variables into config shape
    const envToConfigSchema = z
      .object({
        PORT: z.string().optional(),
        DATA_DIR: z.string().optional(),
        DB_SCHEMA_VERSION: z.string().optional(),
        LABEL_SET_ID: z.string().optional(),
        LABEL_SET_VERSION: z.string().optional(),
      })
      /**
       * Invariant enforcement on environment variables
       *
       * We check that LABEL_SET_ID and LABEL_SET_VERSION are provided together, or neither.
       * This check happens before transformation to ensure we don't create invalid config objects.
       */
      .check((ctx) => {
        const { value: env } = ctx;
        const hasLabelSetId = env.LABEL_SET_ID !== undefined && env.LABEL_SET_ID.trim() !== "";
        const hasLabelSetVersion =
          env.LABEL_SET_VERSION !== undefined && env.LABEL_SET_VERSION.trim() !== "";

        if (hasLabelSetId && !hasLabelSetVersion) {
          ctx.issues.push({
            code: "custom",
            path: ["LABEL_SET_VERSION"],
            input: env,
            message:
              "LABEL_SET_ID is set but LABEL_SET_VERSION is missing. Both LABEL_SET_ID and LABEL_SET_VERSION must be provided together, or neither.",
          });
        }

        if (!hasLabelSetId && hasLabelSetVersion) {
          ctx.issues.push({
            code: "custom",
            path: ["LABEL_SET_ID"],
            input: env,
            message:
              "LABEL_SET_VERSION is set but LABEL_SET_ID is missing. Both LABEL_SET_ID and LABEL_SET_VERSION must be provided together, or neither.",
          });
        }
      })
      .transform((env) => {
        const hasLabelSetId = env.LABEL_SET_ID !== undefined && env.LABEL_SET_ID.trim() !== "";
        const hasLabelSetVersion =
          env.LABEL_SET_VERSION !== undefined && env.LABEL_SET_VERSION.trim() !== "";

        const labelSet =
          hasLabelSetId && hasLabelSetVersion
            ? {
                labelSetId: env.LABEL_SET_ID,
                labelSetVersion: env.LABEL_SET_VERSION,
              }
            : undefined;

        return {
          port: env.PORT,
          dataDir: env.DATA_DIR,
          dbSchemaVersion: env.DB_SCHEMA_VERSION,
          labelSet,
        };
      });

    const configInput = envToConfigSchema.parse(env);
    return ENSRainbowConfigSchema.parse(configInput);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
    }

    throw error;
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
