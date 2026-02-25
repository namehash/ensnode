import type { PublicClient } from "viem";

import type { BlockrangeWithStartBlock } from "./blocks";
import type { ChainId } from "./chains";
import { LocalPonderClient } from "./local-ponder-client";

export const chainIds = {
  Mainnet: 1,
  Optimism: 10,
  Base: 8453,
} as const;

export function createLocalPonderClientMock(overrides?: {
  indexedChainIds?: Set<ChainId>;
  chainsBlockrange?: Map<ChainId, BlockrangeWithStartBlock>;
  cachedPublicClients?: Map<ChainId, PublicClient>;
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
    new Map<ChainId, PublicClient>([
      [chainIds.Mainnet, {} as PublicClient],
      [chainIds.Optimism, {} as PublicClient],
      [chainIds.Base, {} as PublicClient],
    ]);

  return new LocalPonderClient(
    new URL("http://localhost:3000"),
    indexedChainIds,
    chainsBlockrange,
    cachedPublicClients,
  );
}
