import { isAbsolute, resolve } from "node:path";

import { prettifyError, ZodError, z } from "zod/v4";

import { PortSchema } from "@ensnode/ensnode-sdk/internal";

import { ENSRAINBOW_DEFAULT_PORT, getDefaultDataDir } from "@/config/defaults";
import type { ENSRainbowEnvironment } from "@/config/environment";
import type { ArgsConfig, ENSRainbowEnvConfig } from "@/config/types";
import { invariant_dbSchemaVersionMatch } from "@/config/validations";
import { DB_SCHEMA_VERSION } from "@/lib/database";

export type { ArgsConfig, ENSRainbowEnvConfig };

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

const ENSRainbowConfigBaseSchema = z.object({
  port: PortSchema.default(ENSRAINBOW_DEFAULT_PORT),
  dataDir: DataDirSchema.default(() => getDefaultDataDir()),
  dbSchemaVersion: DbSchemaVersionSchema,
});

const ENSRainbowConfigSchema = ENSRainbowConfigBaseSchema.check(invariant_dbSchemaVersionMatch);

export function buildConfigFromEnvironment(env: ENSRainbowEnvironment): ENSRainbowEnvConfig {
  try {
    const envToConfigSchema = z
      .object({
        PORT: z.string().optional(),
        DATA_DIR: z.string().optional(),
        DB_SCHEMA_VERSION: z.string().optional(),
      })
      .transform((env) => {
        return {
          port: env.PORT,
          dataDir: env.DATA_DIR,
          dbSchemaVersion: env.DB_SCHEMA_VERSION,
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

export function buildServeArgsConfig(
  envConfig: ENSRainbowEnvConfig,
  args: { port: number; "data-dir": string },
): ArgsConfig {
  try {
    const dataDir = AbsolutePathSchemaBase.parse(args["data-dir"]);
    return { ...envConfig, port: args.port, dataDir };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid data-dir: \n${prettifyError(error)}\n`);
    }
    throw error;
  }
}
