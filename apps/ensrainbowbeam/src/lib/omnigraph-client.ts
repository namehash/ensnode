import { config } from "@/config";

import { type LabelHash, OMNIGRAPH_LABELS_BY_LABELHASH_MAX } from "enssdk";
import { createEnsNodeClient } from "enssdk/core";
import { graphql, omnigraph } from "enssdk/omnigraph";

import type { LabelHit } from "@/lib/labels";

/**
 * Must equal `LABELS_BY_LABELHASH_MAX` in `apps/ensapi/src/omnigraph-api/schema/label.ts`.
 * EnsRainbowBeam chunks Omnigraph requests so a single submission can exceed this cap.
 */
const OMNIGRAPH_LABEL_LOOKUP_BATCH_SIZE = OMNIGRAPH_LABELS_BY_LABELHASH_MAX;

/**
 * Typed document for the `labels(by: { labelHashes })` Omnigraph query.
 *
 * Variable + result types are derived from the generated introspection in `enssdk/omnigraph`,
 * so changes to the schema break this call site at typecheck time.
 */
export const LabelsByLabelHash = graphql(`
  query LabelsByLabelHash($labelHashes: [LabelHash!]!) {
    labels(by: { labelHashes: $labelHashes }) {
      hash
      interpreted
    }
  }
`);

const client = createEnsNodeClient({ url: config.ensNodeUrl }).extend(omnigraph);

/**
 * Looks up Labels by a batch of LabelHashes against ENSNode's Omnigraph.
 *
 * The Omnigraph resolver enforces a hard cap on how many LabelHashes a single query may carry
 * (`OMNIGRAPH_LABELS_BY_LABELHASH_MAX`). When the caller provides
 * more (e.g. a full submission expanding to up to 200 distinct LabelHashes), this function
 * automatically issues multiple batched requests and merges results.
 *
 * Pass an optional `signal` to forward request cancellation (e.g. handler timeout, client
 * disconnect) to the underlying HTTP requests issued by the Omnigraph SDK.
 */
export async function lookupLabels(
  labelHashes: readonly LabelHash[],
  signal?: AbortSignal,
): Promise<LabelHit[]> {
  if (labelHashes.length === 0) return [];

  const chunks: LabelHash[][] = [];
  for (let i = 0; i < labelHashes.length; i += OMNIGRAPH_LABEL_LOOKUP_BATCH_SIZE) {
    chunks.push(labelHashes.slice(i, i + OMNIGRAPH_LABEL_LOOKUP_BATCH_SIZE) as LabelHash[]);
  }

  const results = await Promise.all(
    chunks.map((batch) =>
      client.omnigraph.query({
        query: LabelsByLabelHash,
        variables: { labelHashes: [...batch] },
        signal,
      }),
    ),
  );

  for (const result of results) {
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Omnigraph labels query returned errors: ${result.errors.map((e) => e.message).join("; ")}`,
      );
    }
  }

  return results.flatMap((r) =>
    (r.data?.labels ?? []).map(({ hash, interpreted }) => ({
      labelhash: hash,
      interpreted,
    })),
  );
}
