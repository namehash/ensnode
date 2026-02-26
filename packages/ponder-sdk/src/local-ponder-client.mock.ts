import { type BlockNumberRange, buildBlockNumberRange } from "./blockrange";
import type { CachedPublicClient } from "./cached-public-client";
import type { ChainId, ChainIdString } from "./chains";
import { LocalPonderClient } from "./local-ponder-client";

export const chainIds = {
  Mainnet: 1,
  Optimism: 10,
  Base: 8453,
} as const;

export function createLocalPonderClientMock(overrides?: {
  indexedChainIds?: Set<ChainId>;
  indexedBlockranges?: Map<ChainId, BlockNumberRange>;
  cachedPublicClients?: Record<ChainIdString, CachedPublicClient>;
}): LocalPonderClient {
  const indexedChainIds =
    overrides?.indexedChainIds ?? new Set<ChainId>([chainIds.Mainnet, chainIds.Optimism]);
  const indexedBlockranges =
    overrides?.indexedBlockranges ??
    new Map<ChainId, BlockNumberRange>([
      [chainIds.Mainnet, buildBlockNumberRange(50, null)],
      [chainIds.Optimism, buildBlockNumberRange(100, null)],
      [chainIds.Base, buildBlockNumberRange(500, null)],
    ]);
  const cachedPublicClients =
    overrides?.cachedPublicClients ??
    ({
      [`${chainIds.Mainnet}`]: {} as CachedPublicClient,
      [`${chainIds.Optimism}`]: {} as CachedPublicClient,
      [`${chainIds.Base}`]: {} as CachedPublicClient,
    } satisfies Record<ChainIdString, CachedPublicClient>);

  return new LocalPonderClient(
    new URL("http://localhost:3000"),
    indexedChainIds,
    indexedBlockranges,
    cachedPublicClients,
  );
}
