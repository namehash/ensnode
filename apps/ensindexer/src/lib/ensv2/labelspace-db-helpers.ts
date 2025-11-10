import type { Context } from "ponder:registry";
import schema from "ponder:schema";
import { labelhash } from "viem";

import { type LiteralLabel, literalLabelToInterpretedLabel } from "@ensnode/ensnode-sdk";

import { reconcileLabelChange } from "@/lib/ensv2/reconciliation";

export async function ensureLabel(context: Context, label: LiteralLabel) {
  const labelHash = labelhash(label);
  const interpretedLabel = literalLabelToInterpretedLabel(label);

  const existing = await context.db.find(schema.label, { labelHash });

  await context.db
    .insert(schema.label)
    .values({ labelHash, value: interpretedLabel })
    .onConflictDoUpdate({ value: interpretedLabel });

  // if the label's interpreted value changed, reconcile in namespace
  if (existing?.value !== interpretedLabel) await reconcileLabelChange(context, labelHash);
}
