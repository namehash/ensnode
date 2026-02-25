import type { PublicClient } from "viem";
import { vi } from "vitest";

import {
  type ChainId,
  type LocalChainIndexingMetrics,
  type LocalPonderClient,
  type LocalPonderIndexingMetrics,
  PonderAppCommands,
  PonderIndexingOrderings,
} from "@ensnode/ponder-sdk";

import {
  earlierBlockRef,
  earliestBlockRef,
  laterBlockRef,
  latestBlockRef,
} from "./block-refs.mock";

export type LocalPonderClientMock = Pick<
  LocalPonderClient,
  "metrics" | "status" | "getChainBlockrange" | "getCachedPublicClient"
>;

export const chainId: ChainId = 1;

const blockRefs = [earliestBlockRef, earlierBlockRef, laterBlockRef, latestBlockRef];

export function buildPublicClientMock(): PublicClient {
  const getBlock = vi.fn(async ({ blockNumber }: { blockNumber: bigint }) => {
    const ref = blockRefs.find((ref) => ref.number === Number(blockNumber));
    if (!ref) {
      throw new Error(`Unknown block number ${blockNumber}`);
    }

    return {
      number: BigInt(ref.number),
      timestamp: BigInt(ref.timestamp),
    };
  });

  return { getBlock } as unknown as PublicClient;
}

export function buildLocalChainsIndexingMetrics(
  chains: Map<ChainId, LocalChainIndexingMetrics>,
): LocalPonderIndexingMetrics {
  return {
    appSettings: {
      command: PonderAppCommands.Start,
      ordering: PonderIndexingOrderings.Omnichain,
    },
    chains,
  };
}

export function buildLocalPonderClientMock(
  overrides: Partial<LocalPonderClientMock> = {},
): LocalPonderClientMock {
  const publicClientMock = buildPublicClientMock();

  return {
    metrics: vi.fn(),
    status: vi.fn(),
    getChainBlockrange: vi.fn(),
    getCachedPublicClient: vi.fn().mockReturnValue(publicClientMock),
    ...overrides,
  };
}
