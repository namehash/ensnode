import type { Address } from "viem";

import { ensIndexerSchema, type IndexingEngineContext } from "@/lib/indexing-engines/ponder";
import type { LogEventBase } from "@/lib/ponder-helpers";
import { makeEventId } from "@/lib/subgraph/ids";

export async function upsertAccount(context: IndexingEngineContext, address: Address) {
  return context.ensDb
    .insert(ensIndexerSchema.subgraph_account)
    .values({ id: address })
    .onConflictDoNothing();
}

export async function upsertDomain(
  context: IndexingEngineContext,
  values: typeof ensIndexerSchema.subgraph_domain.$inferInsert,
) {
  // biome-ignore lint/correctness/noUnusedVariables: remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.ensDb
    .insert(ensIndexerSchema.subgraph_domain)
    .values(values)
    .onConflictDoUpdate(otherValues);
}

export async function upsertResolver(
  context: IndexingEngineContext,
  values: typeof ensIndexerSchema.subgraph_resolver.$inferInsert,
) {
  // biome-ignore lint/correctness/noUnusedVariables: remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.ensDb
    .insert(ensIndexerSchema.subgraph_resolver)
    .values(values)
    .onConflictDoUpdate(otherValues);
}

export async function upsertRegistration(
  context: IndexingEngineContext,
  values: typeof ensIndexerSchema.subgraph_registration.$inferInsert,
) {
  // biome-ignore lint/correctness/noUnusedVariables: remove id primary key for update values
  const { id, ...otherValues } = values;

  return context.ensDb
    .insert(ensIndexerSchema.subgraph_registration)
    .values(values)
    .onConflictDoUpdate(otherValues);
}

// simplifies generating the shared event column values from the ponder Event object
export function sharedEventValues(chainId: number, event: LogEventBase) {
  return {
    id: makeEventId(chainId, event.block.number, event.log.logIndex),
    blockNumber: event.block.number,
    transactionID: event.transaction.hash,
  };
}
