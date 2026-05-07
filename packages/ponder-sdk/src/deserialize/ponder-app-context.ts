/**
 * This module provides functionality to deserialize the "raw" context of
 * a local Ponder app into a validated Ponder App Context.
 *
 * The "raw" context is injected by Ponder at runtime as
 * the `PONDER_COMMON` global variable.
 *
 * @see https://github.com/ponder-sh/ponder/blob/6fcc15d4234e43862cb6e21c05f3c57f4c2f7464/packages/core/src/internal/common.ts#L7-L15
 */

import { prettifyError, z } from "zod/v4";

import {
  type PonderAppCommand,
  PonderAppCommands,
  type PonderAppContext,
} from "../ponder-app-context";
import { wrapPonderAppLogger } from "./ponder-app-logger";
import type { Unvalidated } from "./utils";

/**
 * Schema representing a valid port number for the Ponder app to listen on.
 */
export const schemaPortNumber = z
  .number({ error: "Port must be a number." })
  .int({ error: "Port must be an integer." })
  .min(1, { error: "Port must be greater than or equal to 1." })
  .max(65535, { error: "Port must be less than or equal to 65535." });

/**
 * Represents the Ponder app logger method
 */
const schemaPonderAppLoggerMethod = z.function({
  input: [
    z.looseObject({
      msg: z.string({ error: "Log message must be a string." }),
      error: z.optional(z.unknown()),
    }),
  ],
  output: z.void(),
});

/**
 * Represents the "raw" logger provided by the Ponder runtime to a local Ponder app.
 */
const schemaRawPonderAppLogger = z.looseObject({
  error: schemaPonderAppLoggerMethod,
  warn: schemaPonderAppLoggerMethod,
  info: schemaPonderAppLoggerMethod,
  debug: schemaPonderAppLoggerMethod,
  trace: schemaPonderAppLoggerMethod,
});

/**
 * Represents the "wrapper" logger that formats log parameters
 * before passing to the underlying logger.
 */
const schemaPonderAppLogger = schemaRawPonderAppLogger.transform(wrapPonderAppLogger);

/**
 * Type representing the "raw" context of a local Ponder app.
 */
const schemaRawPonderAppContext = z.object({
  options: z.object({
    command: z.enum(PonderAppCommands),
    port: schemaPortNumber,
  }),
  logger: schemaRawPonderAppLogger,
});

/**
 * Type representing the "raw" context of a local Ponder app.
 */
export type RawPonderAppContext = z.infer<typeof schemaRawPonderAppContext>;

/**
 * Schema representing the "deserialized" context of a local Ponder app.
 */
const schemaPonderAppContext = z.object({
  command: z.enum(PonderAppCommands),
  localPonderAppUrl: z.instanceof(URL, { error: "localPonderAppUrl must be a valid URL." }),
  logger: schemaPonderAppLogger,
});

/**
 * Build unvalidated Ponder App Context
 *
 * @param rawPonderAppContext valid raw Ponder App Context from Ponder app.
 * @returns Unvalidated Ponder App Context
 *          to be validated with {@link schemaPonderAppContext}.
 */
function buildUnvalidatedPonderAppContext(
  rawPonderAppContext: RawPonderAppContext,
): Unvalidated<PonderAppContext> {
  return {
    command: rawPonderAppContext.options.command as Unvalidated<PonderAppCommand>,
    localPonderAppUrl: new URL(`http://localhost:${rawPonderAppContext.options.port}`),
    logger: rawPonderAppContext.logger,
  };
}

/**
 * Deserialize and validate a Raw Ponder App Context.
 *
 * @param unvalidatedRawPonderAppContext Raw Ponder App Context to be validated.
 * @returns Deserialized and validated Ponder App Context.
 * @throws Error if data cannot be deserialized into a valid Ponder App Context.
 */
export function deserializePonderAppContext(
  unvalidatedRawPonderAppContext: Unvalidated<RawPonderAppContext>,
): PonderAppContext {
  const validation = schemaRawPonderAppContext
    .transform(buildUnvalidatedPonderAppContext)
    .pipe(schemaPonderAppContext)
    .safeParse(unvalidatedRawPonderAppContext);

  if (!validation.success) {
    throw new Error(`Invalid raw Ponder App Context: ${prettifyError(validation.error)}`);
  }

  return validation.data;
}
