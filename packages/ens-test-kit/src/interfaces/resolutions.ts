import type { ChainId, Hex, NormalizedName, RecordsSelection, ResolvedRecords } from "../types";

export interface ResolutionsApi {
  resolveRecords(name: NormalizedName, selection: RecordsSelection): Promise<ResolvedRecords>;
  resolvePrimaryName(address: Hex, chainId: ChainId): Promise<string | null>;
  resolvePrimaryNames(address: Hex, chainIds?: ChainId[]): Promise<Record<ChainId, string | null>>;
}
