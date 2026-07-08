import {
  asInterpretedLabel,
  encodeLabelHash,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  literalLabelToInterpretedLabel,
} from "enssdk";

import { cascadeLabelHeal } from "@/lib/ensv2/canonicality-db-helpers";
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
 * When this upgrades an existing row's `interpreted` value (a heal), propagates the new value to
 * every canonical Domain whose `canonicalLabelHashPath` contains this `labelHash`.
 */
export async function ensureLabel(context: IndexingEngineContext, label: LiteralLabel) {
  const labelHash = labelhashLiteralLabel(label);
  const interpreted = literalLabelToInterpretedLabel(label);

  // TODO: this re-implements labelExists, can likely DRY it up
  const prev = await context.ensDb.find(ensIndexerSchema.label, { labelHash });

  // Snapshot whether this upsert heals an existing (differently-interpreted) row BEFORE the write.
  // `context.ensDb.find` returns a live reference to the in-memory buffered row, and the
  // `onConflictDoUpdate` below mutates that same object's `interpreted` field in place — so checking
  // `prev.interpreted !== interpreted` AFTER the upsert always reads the just-written value and is
  // never true. That silently suppressed the heal cascade for every label healed after first sight
  // (e.g. an ENSv1 Domain's `[labelHash]` label later healed via an ENSv2 subname sharing the label).
  const isHeal = prev !== null && prev.interpreted !== interpreted;

  await context.ensDb
    .insert(ensIndexerSchema.label)
    .values({ labelHash, interpreted })
    .onConflictDoUpdate({ interpreted });

  // if this was a heal (previously seen, now upgraded), cascade the update to the materialized names
  if (isHeal) await cascadeLabelHeal(context, labelHash);
}

/**
 * Ensures that the LabelHash `labelHash` is available in the Label rainbow table, also attempting
 * an ENSRainbow heal. To avoid duplicate ENSRainbow healing requests, callers must gate this
 * function on {@link labelExists} returning false.
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
