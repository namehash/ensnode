import type { Address } from "enssdk";

import { interpretAddress } from "@ensnode/ensnode-sdk";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";

/**
 * Process-local memo of account ids we have already upserted into `ensIndexerSchema.account`
 * within this indexer process.
 *
 * ensureAccount is called from many handlers on every event, but the set of distinct accounts
 * grows much more slowly than the event stream — the zero address, common controllers, and
 * active registrants recur constantly. Measured against a benchmark of average handler duration
 * over 10M events on mainnet (ensv2,protocol-acceleration, ENSRainbow stubbed), this memo
 * deduplicated ~40% of account upserts (4.16M of ~10.4M) and cut wall-clock by ~5%.
 *
 * Safety:
 * - The underlying insert is `onConflictDoNothing`, so repeat inserts are idempotent. The memo
 *   is purely an optimization and does not change semantics.
 * - On process restart the Set resets. We will re-insert accounts we saw last time, but the
 *   insert is still idempotent, so this is still correct — it just costs one redundant DB op
 *   the first time each account is seen after a restart.
 */
const ensuredAccounts = new Set<string>();

/**
 * Ensures that the account identified by `address` exists.
 * If `address` is the zeroAddress, no-op.
 */
export async function ensureAccount(context: IndexingEngineContext, address: Address) {
  const interpreted = interpretAddress(address);
  if (interpreted === null) return;

  // memoize the below operation by `interpreted`
  if (ensuredAccounts.has(interpreted)) return;
  ensuredAccounts.add(interpreted);

  await context.ensDb
    .insert(ensIndexerSchema.account)
    .values({ id: interpreted })
    .onConflictDoNothing();
}
