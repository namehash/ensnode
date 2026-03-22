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
import type { Unvalidated } from "./utils";

/**
 * Type representing the "raw" context of a local Ponder app.
 */
const schemaRawPonderAppContext = z.object({
  options: z.object({
    command: z.string(),
  }),
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
