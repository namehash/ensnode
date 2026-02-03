import packageJson from "@/../package.json" with { type: "json" };

import { isAbsolute, resolve } from "node:path";

import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema, PortSchema } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";
import type { ENSRainbowEnvConfig } from "@/config/types";
import { invariant_dbSchemaVersionMatch } from "@/config/validations";
import { DB_SCHEMA_VERSION } from "@/lib/database";

export type { ENSRainbowEnvConfig };

export const AbsolutePathSchemaBase = z
  .string()
  .trim()
  .min(1, {
    error: "Path must be a non-empty string.",
  })
  .transform((path: string) => {
    if (isAbsolute(path)) {
      return path;
    }
    return resolve(process.cwd(), path);
  });

const DataDirSchema = AbsolutePathSchemaBase;

export const DbSchemaVersionSchemaBase = z.coerce
  .number({ error: "DB_SCHEMA_VERSION must be a number." })
  .int({ error: "DB_SCHEMA_VERSION must be an integer." })
  .positive({ error: "DB_SCHEMA_VERSION must be greater than 0." });

const DbSchemaVersionSchema = DbSchemaVersionSchemaBase.default(DB_SCHEMA_VERSION);

const LabelSetSchema = makeFullyPinnedLabelSetSchema("LABEL_SET");

const ENSRainbowConfigBaseSchema = z.object({
  port: PortSchema.default(ENSRAINBOW_DEFAULT_PORT),
  dataDir: DataDirSchema.default(() => getDefaultDataDir()),
  dbSchemaVersion: DbSchemaVersionSchema,
  labelSet: LabelSetSchema.optional(),
});

const hasValue = (str: string | undefined): boolean => {
  return str !== undefined && str.trim() !== "";
};

const ENSRainbowConfigSchema = ENSRainbowConfigBaseSchema.check(invariant_dbSchemaVersionMatch);

export function buildConfigFromEnvironment(env: ENSRainbowEnvironment): ENSRainbowEnvConfig {
  try {
    const envToConfigSchema = z
      .object({
        PORT: z.string().optional(),
        DATA_DIR: z.string().optional(),
        DB_SCHEMA_VERSION: z.string().optional(),
        LABEL_SET_ID: z.string().optional(),
        LABEL_SET_VERSION: z.string().optional(),
      })
      .check((ctx) => {
        const { value: env } = ctx;
        const hasLabelSetId = hasValue(env.LABEL_SET_ID);
        const hasLabelSetVersion = hasValue(env.LABEL_SET_VERSION);

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
        const hasLabelSetId = hasValue(env.LABEL_SET_ID);
        const hasLabelSetVersion = hasValue(env.LABEL_SET_VERSION);

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

export function buildENSRainbowPublicConfig(
  _config: ENSRainbowEnvConfig,
  labelSet: EnsRainbowServerLabelSet,
  recordsCount: number,
): EnsRainbow.ENSRainbowPublicConfig {
  return {
    version: packageJson.version,
    labelSet,
    recordsCount,
  };
}
