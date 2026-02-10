import { z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { schemaChainId } from "../chains";

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
  .check(invariant_chainIdStringRepresentsValidChainId)
  .pipe(z.preprocess((v) => Number(v), schemaChainId));
