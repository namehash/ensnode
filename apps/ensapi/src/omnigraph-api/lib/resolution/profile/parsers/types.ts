import type { ResolverRecordsSelection } from "@ensnode/ensnode-sdk";

import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

/**
 * Declares which records a profile field needs and how to derive its GraphQL output from them.
 *
 * Each profile field is implemented as a singleton `ProfileFieldParser`. The parent resolver
 * passes the shared `ResolvedRecordsModel` to `parse`, keeping all resolution in one round-trip.
 */
export interface ProfileFieldParser<TOutput> {
  /** The record keys this parser requires. Merged into the parent selection before resolution. */
  selection: ResolverRecordsSelection;
  /** Derive the GraphQL output from the resolved records, or null if the record is unset. */
  parse(records: ResolvedRecordsModel): TOutput | null;
}
