import {
  asLiteralLabel,
  encodeLabelHash,
  type InterpretedLabel,
  type Label,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  normalizeLabel,
} from "enssdk";

/**
 * Per-label classification status against the ENSNode index.
 *
 * - `unknown_in_index`: the normalized label's labelhash is present in the index but its
 *   interpreted form is the encoded labelhash (i.e. the literal label has not yet been healed).
 *   These submissions are the interesting candidates for future on-chain emission.
 * - `healed_in_index`: the normalized label's labelhash is present in the index and carries a healed
 *   (normalized literal) interpreted form.
 * - `absent_from_index`: the normalized label's labelhash is not present in the index.
 * - `skipped_unnormalized`: the raw label could not be normalized under ENSIP-15.
 */
export type LabelStatus =
  | "unknown_in_index"
  | "healed_in_index"
  | "absent_from_index"
  | "skipped_unnormalized";

/**
 * LabelHashing result for a single submitted label that normalized successfully.
 *
 * `rawLabel` is always a {@link LiteralLabel}: submissions are never typed or coerced as
 * {@link InterpretedLabel}. `labelHash` is always {@link labelhashLiteralLabel} of the
 * ENSIP-15-normalized literal only (never the raw submission when it differs).
 */
export type HashedLabel = {
  rawLabel: LiteralLabel;
  labelHash: LabelHash;
  normalizedLabel?: LiteralLabel;
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
  labelhash: LabelHash;
  interpreted: InterpretedLabel;
};

/**
 * Normalizes `rawLabel` under ENSIP-15 and returns its labelhash.
 *
 * Returns `null` when normalization fails.
 */
export function labelhashNormalizedLabel(rawLabel: LiteralLabel): HashedLabel | null {
  try {
    const normalizedInterpreted = normalizeLabel(rawLabel);
    const normalizedLabel = asLiteralLabel(normalizedInterpreted);
    const labelHash = labelhashLiteralLabel(normalizedLabel);

    const result: HashedLabel = { rawLabel, labelHash };
    if ((normalizedInterpreted as Label) !== (rawLabel as Label)) {
      result.normalizedLabel = normalizedLabel;
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Returns the deduped flat list of labelhashes to look up via the Omnigraph
 * `labels(by: { labelHashes })` query.
 */
export function collectLookupHashes(hashed: readonly HashedLabel[]): LabelHash[] {
  return Array.from(new Set(hashed.map((item) => item.labelHash)));
}

/**
 * True when an Omnigraph `Label` row represents an unhealed/unknown label
 * (i.e. its `interpreted` form is the Encoded LabelHash of its `labelhash`).
 */
export function isUnhealedHit(hit: LabelHit): boolean {
  return hit.interpreted === encodeLabelHash(hit.labelhash);
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
  for (const hit of hits) hitsByHash.set(hit.labelhash, hit);

  return hashed.map((item) => {
    const hit = hitsByHash.get(item.labelHash);

    let status: LabelStatus;
    if (hit === undefined) {
      status = "absent_from_index";
    } else if (isUnhealedHit(hit)) {
      status = "unknown_in_index";
    } else {
      status = "healed_in_index";
    }

    return { ...item, status };
  });
}
