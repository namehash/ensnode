import { getConfig } from "@/config";

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

let cachedClient: ReturnType<typeof makeClient> | undefined;

function makeClient(url: string) {
  return createEnsNodeClient({ url }).extend(omnigraph);
}

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = makeClient(getConfig().ensNodeUrl);
  return cachedClient;
}

/**
 * Looks up Labels by a batch of LabelHashes against ENSNode's Omnigraph.
 *
 * The Omnigraph resolver enforces a hard cap (see `LABELS_BY_HASHES_MAX` in
 * `apps/ensapi/src/omnigraph-api/schema/label.ts`); the collector should pre-cap to the same
 * limit to fail fast on the client side before making the request.
 */
export async function lookupLabels(hashes: readonly string[]): Promise<LabelHit[]> {
  if (hashes.length === 0) return [];

  const result = await getClient().omnigraph.query({
    query: LabelsByHashes,
    variables: { hashes: hashes as `0x${string}`[] },
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(
      `Omnigraph labels query returned errors: ${result.errors.map((e) => e.message).join("; ")}`,
    );
  }

  return (result.data?.labels ?? []) as LabelHit[];
}

/**
 * Resets the memoized Omnigraph client. Test-only.
 */
export function resetOmnigraphClientCacheForTesting(): void {
  cachedClient = undefined;
}
