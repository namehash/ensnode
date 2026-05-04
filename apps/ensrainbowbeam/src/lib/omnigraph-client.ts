import { config } from "@/config";

import type { LabelHash } from "enssdk";
import { createEnsNodeClient } from "enssdk/core";
import { graphql, omnigraph } from "enssdk/omnigraph";

import type { LabelHit } from "@/lib/labels";

/**
 * Typed document for the `labels(by: { hashes })` Omnigraph query.
 *
 * Variable + result types are derived from the generated introspection in `enssdk/omnigraph`,
 * so changes to the schema break this call site at typecheck time.
 */
export const LabelsByHashes = graphql(`
  query LabelsByHashes($hashes: [Hex!]!) {
    labels(by: { hashes: $hashes }) {
      hash
      interpreted
    }
  }
`);

const client = createEnsNodeClient({ url: config.ensNodeUrl }).extend(omnigraph);

/**
 * Looks up Labels by a batch of LabelHashes against ENSNode's Omnigraph.
 *
 * The Omnigraph resolver enforces a hard cap on `hashes.length` (see `LABELS_BY_HASHES_MAX`
 * in `apps/ensapi/src/omnigraph-api/schema/label.ts`). The submissions handler caps raw
 * labels per request via `MAX_LABELS_PER_SUBMISSION`, sized so that the worst-case expansion
 * (each label producing both a raw and a normalized hash) stays within the resolver cap.
 *
 * Pass an optional `signal` to forward request cancellation (e.g. handler timeout, client
 * disconnect) to the underlying HTTP request issued by the Omnigraph SDK.
 */
export async function lookupLabels(
  hashes: readonly LabelHash[],
  signal?: AbortSignal,
): Promise<LabelHit[]> {
  if (hashes.length === 0) return [];

  const result = await client.omnigraph.query({
    query: LabelsByHashes,
    // The generated `LabelsByHashes` document types `hashes` as a mutable `Hex[]`, so we copy
    // the readonly input into a fresh mutable array. No runtime cost beyond an `Array.from`.
    variables: { hashes: [...hashes] },
    signal,
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(
      `Omnigraph labels query returned errors: ${result.errors.map((e) => e.message).join("; ")}`,
    );
  }

  return result.data?.labels ?? [];
}
