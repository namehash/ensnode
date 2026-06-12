import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

/**
 * Declares which records a profile field needs and how to derive its GraphQL output from them.
 *
 * Each profile field is implemented as a singleton `ProfileFieldInterpreter`. The parent resolver
 * passes the shared `ResolvedRecordsModel` to `interpret`, keeping all resolution in one round-trip.
 */
export interface ProfileFieldInterpreter<TOutput> {
  /** The record keys this interpreter requires. Merged into the parent selection before resolution. */
  selection: ResolverRecordsSelection;
  /** Derive the GraphQL output from the resolved records, or null if the record is unset. */
  interpret(result: ResolvedRecordsModel): TOutput | null;
}
