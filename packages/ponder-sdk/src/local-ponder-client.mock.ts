import type { BlockrangeWithStartBlock } from "./blocks";
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
  chainsBlockrange?: Map<ChainId, BlockrangeWithStartBlock>;
  cachedPublicClients?: Record<ChainIdString, CachedPublicClient>;
}): LocalPonderClient {
  const indexedChainIds =
    overrides?.indexedChainIds ?? new Set<ChainId>([chainIds.Mainnet, chainIds.Optimism]);
  const chainsBlockrange =
    overrides?.chainsBlockrange ??
    new Map<ChainId, BlockrangeWithStartBlock>([
      [chainIds.Mainnet, { startBlock: 50 }],
      [chainIds.Optimism, { startBlock: 100 }],
      [chainIds.Base, { startBlock: 500 }],
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
    chainsBlockrange,
    cachedPublicClients,
  );
}
