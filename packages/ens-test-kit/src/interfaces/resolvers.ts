import type { ChainId, NormalizedName, Resolver, ResolverId } from "../types";

export interface ResolversApi {
  getResolver(id: ResolverId): Promise<Resolver | null>;
  listResolverRecords(name: NormalizedName): Promise<{ keys: string[]; coinTypes: ChainId[] }>;
}
