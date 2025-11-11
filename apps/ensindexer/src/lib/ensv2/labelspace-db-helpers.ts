import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { labelhash } from "viem";

import { type LiteralLabel, literalLabelToInterpretedLabel } from "@ensnode/ensnode-sdk";

export async function ensureLabel(context: Context, label: LiteralLabel) {
  const labelHash = labelhash(label);
  const interpretedLabel = literalLabelToInterpretedLabel(label);

  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoUpdate({ value: interpretedLabel });
}
