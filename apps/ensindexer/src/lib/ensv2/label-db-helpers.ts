import {
  asInterpretedLabel,
  encodeLabelHash,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  literalLabelToInterpretedLabel,
} from "enssdk";

import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Ensures that the LiteralLabel `label` is interpreted and upserted into the Label rainbow table.
 */
export async function ensureLabel(context: IndexingEngineContext, label: LiteralLabel) {
  const labelHash = labelhashLiteralLabel(label);
  const interpreted = literalLabelToInterpretedLabel(label);

  await context.ensDb
    .insert(ensIndexerSchema.label)
    .values({ labelHash, interpreted })
    .onConflictDoUpdate({ interpreted });
}

/**
 * Ensures that the LabelHash `labelHash` is available in the Label rainbow table, attempting an
 * ENSRainbow heal if this is the first time it has been encountered.
 */
export async function ensureUnknownLabel(context: IndexingEngineContext, labelHash: LabelHash) {
  // do nothing for existing labels, they're either healed or we don't know them
  const exists = await context.ensDb.find(ensIndexerSchema.label, { labelHash });
  if (exists) return;

  // attempt ENSRainbow heal
  const healedLabel = await labelByLabelHash(labelHash);

  // if healed, ensure (known) label
  if (healedLabel) return await ensureLabel(context, healedLabel);

  // otherwise upsert label entity
  const interpreted = asInterpretedLabel(encodeLabelHash(labelHash));
  await context.ensDb
    .insert(ensIndexerSchema.label)
    .values({ labelHash, interpreted })
    .onConflictDoNothing();
}
