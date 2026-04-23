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
 * Determines whether the Label identified by `labelHash` has already been indexed.
 */
export async function labelExists(context: IndexingEngineContext, labelHash: LabelHash) {
  const existing = await context.ensDb.find(ensIndexerSchema.label, { labelHash });
  return existing !== null;
}

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
 * Ensures that the LabelHash `labelHash` is available in the Label rainbow table, also attempting
 * an ENSRainbow heal. To avoid duplicate ENSRainbow healing request, callers must conditionally call
 * this function based on the result of {@link ensureLabel}.
 */
export async function ensureUnknownLabel(context: IndexingEngineContext, labelHash: LabelHash) {
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
