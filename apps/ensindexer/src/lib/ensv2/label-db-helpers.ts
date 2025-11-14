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

import { labelByLabelHash } from "@/lib/graphnode-helpers";

export async function ensureLabel(context: Context, label: LiteralLabel) {
  const labelHash = labelhash(label);
  const interpretedLabel = literalLabelToInterpretedLabel(label);

  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoUpdate({ value: interpretedLabel });
}

export async function ensureUnknownLabel(context: Context, labelHash: LabelHash) {
  // do nothing for existing labels, they're either healed or we don't know them
  const exists = await context.db.find(schema.label, { labelHash });
  if (exists) return;

  // attempt ENSRainbow heal
  const healedLabel = await labelByLabelHash(labelHash);
  if (healedLabel) return await ensureLabel(context, healedLabel);

  // otherwise
  const interpretedLabel = encodeLabelHash(labelHash) as InterpretedLabel;
  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoNothing();
}
