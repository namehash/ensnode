import {
  asLiteralLabel,
  encodeLabelHash,
  type InterpretedLabel,
  isNormalizedLabel,
  type Label,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  normalizeLabel,
} from "enssdk";

/**
 * Per-label classification status against the ENSNode index.
 *
 * - `unknown_in_index`: at least one of the label's hashes is present in the index but its
 *   interpreted form is the encoded labelhash (i.e. the literal label has not yet been healed).
 *   These submissions are the interesting candidates for future on-chain emission.
 * - `healed_in_index`: at least one of the label's hashes is present in the index and every
 *   returned hit already carries a healed (normalized literal) interpreted form.
 * - `absent_from_index`: none of the label's hashes are present in the index at all.
 */
export type LabelStatus =
  | "unknown_in_index"
  | "healed_in_index"
  | "absent_from_index"
  | "skipped_unnormalized";

/**
 * The hashing result for a single submitted label.
 *
 * `rawLabel` is always a {@link LiteralLabel}: submissions are never typed or coerced as
 * {@link InterpretedLabel}, so unnormalized discovery remains representable.
 *
 * `normalizedLabel` (and its hash) are populated only when the label is normalizable under
 * ENSIP-15 and the normalized form differs from the raw literal. That branch still hashes via
 * {@link labelhashLiteralLabel} on a new {@link LiteralLabel} cast of the normalized string.
 */
export type HashedLabel = {
  rawLabel: LiteralLabel;
  labelHash: LabelHash;
  normalizedLabel?: LiteralLabel;
  normalizedLabelHash?: LabelHash;
};

/**
 * Per-label classification entry returned to the caller and emitted to the stdout sink.
 */
export type LabelClassification = HashedLabel & {
  status: LabelStatus;
};

export type SkippedLabelClassification = {
  rawLabel: LiteralLabel;
  status: "skipped_unnormalized";
};

/**
 * Subset of `Label` fields returned by the Omnigraph `labels` query that we care about.
 */
export type LabelHit = {
  hash: LabelHash;
  interpreted: InterpretedLabel;
};

/**
 * True when a submitted label is already normalized under ENSIP-15.
 */
export function isProcessableLabel(rawLabel: LiteralLabel): boolean {
  return isNormalizedLabel(rawLabel as unknown as Label);
}

/**
 * Computes the hash representations of a single submitted {@link LiteralLabel}.
 *
 * Always computes `labelHash = labelhashLiteralLabel(rawLabel)`. If the label normalizes under
 * ENSIP-15 to a **different string** than the submission, also computes hashes for that
 * normalized form as a distinct {@link LiteralLabel}. Normalization failures are tolerated and
 * treated as "no normalized variant".
 */
export function hashLabel(rawLabel: LiteralLabel): HashedLabel {
  const labelHash = labelhashLiteralLabel(rawLabel);

  let normalizedLabel: LiteralLabel | undefined;
  let normalizedLabelHash: LabelHash | undefined;
  try {
    const normalizedInterpreted = normalizeLabel(rawLabel);
    // Compare as unbranded labels: normalization yields InterpretedLabel; submission is LiteralLabel.
    if ((normalizedInterpreted as Label) !== (rawLabel as Label)) {
      normalizedLabel = asLiteralLabel(normalizedInterpreted);
      normalizedLabelHash = labelhashLiteralLabel(normalizedLabel);
    }
  } catch {
    // unnormalizable raw label is expected; leave normalized variant undefined
  }

  const result: HashedLabel = { rawLabel, labelHash };
  if (normalizedLabel !== undefined) {
    result.normalizedLabel = normalizedLabel;
    result.normalizedLabelHash = normalizedLabelHash;
  }
  return result;
}

/**
 * Returns the deduped flat list of labelhashes we want to look up via the Omnigraph
 * `labels(by: { labelHashes })` query.
 */
export function collectLookupHashes(hashed: readonly HashedLabel[]): LabelHash[] {
  const set = new Set<LabelHash>();
  for (const item of hashed) {
    set.add(item.labelHash);
    if (item.normalizedLabelHash !== undefined) set.add(item.normalizedLabelHash);
  }
  return Array.from(set);
}

/**
 * True when an Omnigraph `Label` row represents an unhealed/unknown label
 * (i.e. its `interpreted` form is the Encoded LabelHash of its `hash`).
 */
export function isUnhealedHit(hit: LabelHit): boolean {
  return hit.interpreted === encodeLabelHash(hit.hash);
}

/**
 * Joins per-label hashes against the omnigraph hits and assigns a {@link LabelStatus} to each
 * submitted raw label.
 */
export function classifySubmissions(
  hashed: readonly HashedLabel[],
  hits: readonly LabelHit[],
): LabelClassification[] {
  const hitsByHash = new Map<LabelHash, LabelHit>();
  for (const hit of hits) hitsByHash.set(hit.hash, hit);

  return hashed.map((item) => {
    const candidateHashes: LabelHash[] = [item.labelHash];
    if (item.normalizedLabelHash !== undefined) candidateHashes.push(item.normalizedLabelHash);

    const matchedHits = candidateHashes
      .map((h) => hitsByHash.get(h))
      .filter((h): h is LabelHit => h !== undefined);

    let status: LabelStatus;
    if (matchedHits.length === 0) {
      status = "absent_from_index";
    } else if (matchedHits.some(isUnhealedHit)) {
      status = "unknown_in_index";
    } else {
      status = "healed_in_index";
    }

    return { ...item, status };
  });
}
