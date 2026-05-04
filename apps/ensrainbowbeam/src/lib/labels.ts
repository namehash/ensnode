import {
  encodeLabelHash,
  type InterpretedLabel,
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
export type LabelStatus = "unknown_in_index" | "healed_in_index" | "absent_from_index";

/**
 * The hashing result for a single submitted raw label.
 *
 * `normalizedLabel` (and its hash) are populated only when the raw label is normalizable
 * AND the normalized form differs from the raw label.
 */
export type HashedLabel = {
  rawLabel: string;
  labelHash: LabelHash;
  normalizedLabel?: InterpretedLabel;
  normalizedLabelHash?: LabelHash;
};

/**
 * Per-label classification entry returned to the caller and emitted to the stdout sink.
 */
export type LabelClassification = HashedLabel & {
  status: LabelStatus;
};

/**
 * Subset of `Label` fields returned by the Omnigraph `labels` query that we care about.
 */
export type LabelHit = {
  hash: LabelHash;
  interpreted: InterpretedLabel;
};

/**
 * Computes the hash representations of a single raw label.
 *
 * Always computes `labelHash = labelhashLiteralLabel(rawLabel)`. If the raw label is
 * normalizable AND its normalized form differs from the raw value, also computes the
 * normalized form's hash. Normalization failures are tolerated and treated as "no
 * normalized variant" — many submissions will be unnormalizable by design (this app
 * is meant to ingest such labels).
 */
export function hashLabel(rawLabel: string): HashedLabel {
  const labelHash = labelhashLiteralLabel(rawLabel as LiteralLabel);

  let normalizedLabel: InterpretedLabel | undefined;
  let normalizedLabelHash: LabelHash | undefined;
  try {
    const candidate = normalizeLabel(rawLabel);
    if (candidate !== rawLabel) {
      normalizedLabel = candidate;
      normalizedLabelHash = labelhashLiteralLabel(candidate as unknown as LiteralLabel);
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
 * `labels(by: { hashes })` query.
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
