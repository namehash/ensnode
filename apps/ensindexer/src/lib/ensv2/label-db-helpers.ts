import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { labelhash } from "viem";

import {
  encodeLabelHash,
  type InterpretedLabel,
  type LabelHash,
  type LiteralLabel,
  literalLabelToInterpretedLabel,
} from "@ensnode/ensnode-sdk";

export async function ensureLabel(context: Context, label: LiteralLabel) {
  const labelHash = labelhash(label);
  const interpretedLabel = literalLabelToInterpretedLabel(label);

  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoUpdate({ value: interpretedLabel });
}

export async function ensureUnknownLabel(context: Context, labelHash: LabelHash) {
  const interpretedLabel = encodeLabelHash(labelHash) as InterpretedLabel;

  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoNothing();
}
