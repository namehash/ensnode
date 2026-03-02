import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";
import { formatError } from "zod/v4/core";

import { type ChainId, type ChainIdString, schemaChainId } from "../chains";
import type { Unvalidated } from "./utils";

function invariant_chainIdStringRepresentsValidChainId(ctx: ParsePayload<string>) {
  const maybeChainId = ctx.value;

  if (`${Number(maybeChainId)}` !== maybeChainId) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `'${maybeChainId}' must be a string representing a chain ID.`,
    });
  }
}

export const schemaChainIdString = z
  .string({ error: `Value must be a string representing a chain ID.` })
  .check(invariant_chainIdStringRepresentsValidChainId);

/**
 * Deserialize an unvalidated string representation of a chain ID.
 */
export function deserializeChainId(unvalidatedData: Unvalidated<ChainIdString>): ChainId {
  const parsed = schemaChainIdString
    .transform((val) => Number(val))
    .pipe(schemaChainId)
    .safeParse(unvalidatedData);

  if (parsed.error) {
    throw new Error(`Cannot deserialize Chain ID String:\n${formatError(parsed.error)}\n`);
  }

  return parsed.data;
}
