import { type BlockNumberRangeWithStartBlock, buildBlockNumberRange } from "./blockrange";
import type { CachedPublicClient } from "./cached-public-client";
import type { ChainId, ChainIdString } from "./chains";
import { LocalPonderClient } from "./local-ponder-client";
import { PonderAppCommands, type PonderAppContext } from "./ponder-app-context";

export const chainIds = {
  Mainnet: 1,
  Optimism: 10,
  Base: 8453,
} as const;

export function createLocalPonderClientMock(overrides?: {
  indexedChainIds?: Set<ChainId>;
  indexedBlockranges?: Map<ChainId, BlockNumberRangeWithStartBlock>;
  cachedPublicClients?: Record<ChainIdString, CachedPublicClient>;
  ponderAppContext?: Pick<PonderAppContext, "command">;
}): LocalPonderClient {
  const indexedChainIds =
    overrides?.indexedChainIds ?? new Set<ChainId>([chainIds.Mainnet, chainIds.Optimism]);

  const indexedBlockranges =
    overrides?.indexedBlockranges ??
    new Map<ChainId, BlockNumberRangeWithStartBlock>([
      [chainIds.Mainnet, buildBlockNumberRange(100, undefined)],
      [chainIds.Optimism, buildBlockNumberRange(200, undefined)],
      [chainIds.Base, buildBlockNumberRange(500, undefined)],
    ]);

  const cachedPublicClients =
    overrides?.cachedPublicClients ??
    ({
      [`${chainIds.Mainnet}`]: {} as CachedPublicClient,
      [`${chainIds.Optimism}`]: {} as CachedPublicClient,
      [`${chainIds.Base}`]: {} as CachedPublicClient,
    } satisfies Record<ChainIdString, CachedPublicClient>);

  const ponderAppContext = {
    command: overrides?.ponderAppContext?.command ?? PonderAppCommands.Start,
    localPonderAppUrl: new URL("http://localhost:3000"),
    logger: {
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
    },
  } satisfies PonderAppContext;

  return new LocalPonderClient(
    indexedChainIds,
    indexedBlockranges,
    cachedPublicClients,
    ponderAppContext,
  );
}
