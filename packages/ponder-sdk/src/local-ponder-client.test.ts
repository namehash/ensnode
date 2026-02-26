import { afterEach, describe, expect, it, vi } from "vitest";

import { earlierBlockRef, earliestBlockRef, latestBlockRef } from "./block-refs.mock";
import type { BlockrangeWithStartBlock } from "./blocks";
import type { CachedPublicClient } from "./cached-public-client";
import type { ChainId } from "./chains";
import { PonderClient } from "./client";
import {
  type ChainIndexingMetricsHistorical,
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  PonderAppCommands,
  type PonderIndexingMetrics,
  PonderIndexingOrderings,
} from "./indexing-metrics";
import { chainIds, createLocalPonderClientMock } from "./local-ponder-client.mock";

describe("LocalPonderClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("filters Ponder app metadata to only include entries for indexed chains", () => {
      // Arrange
      const client = createLocalPonderClientMock({
        indexedChainIds: new Set([chainIds.Mainnet, chainIds.Optimism]),
      });

      // Act & Assert
      expect(() => client.getIndexedBlockrange(chainIds.Base)).toThrowError(
        /Chain ID 8453 is not being indexed and therefore has no indexed blockrange./,
      );

      expect(() => client.getCachedPublicClient(chainIds.Base)).toThrowError(
        /Chain ID 8453 is not being indexed and therefore has no cached public client./,
      );
    });

    it("throws when chains blockrange is missing an indexed chain", () => {
      // Arrange
      const chainsBlockrange = new Map<ChainId, BlockrangeWithStartBlock>([
        [chainIds.Mainnet, { startBlock: 50 }],
      ]);

      // Act & Assert
      expect(() =>
        createLocalPonderClientMock({
          indexedChainIds: new Set([chainIds.Mainnet, chainIds.Optimism]),
          chainsBlockrange,
        }),
      ).toThrowError(
        /Local Ponder Client is missing the Indexed Blockranges for indexed chain IDs: 10/,
      );
    });

    it("throws when cached public clients are missing an indexed chain", () => {
      // Arrange
      const cachedPublicClients = {
        [`${chainIds.Mainnet}`]: {} as CachedPublicClient,
      };

      // Act & Assert
      expect(() =>
        createLocalPonderClientMock({
          cachedPublicClients,
          indexedChainIds: new Set([chainIds.Mainnet, chainIds.Optimism]),
        }),
      ).toThrowError(
        /Local Ponder Client is missing the Cached Public Clients for indexed chain IDs: 10/,
      );
    });
  });

  describe("getIndexedBlockrange()", () => {
    it("returns blockrange for indexed chain", () => {
      // Arrange & Act
      const client = createLocalPonderClientMock({
        indexedChainIds: new Set([chainIds.Mainnet]),
        chainsBlockrange: new Map<ChainId, BlockrangeWithStartBlock>([
          [chainIds.Mainnet, { startBlock: 50 }],
        ]),
      });

      expect(client.getIndexedBlockrange(chainIds.Mainnet)).toStrictEqual({ startBlock: 50 });
    });
  });

  describe("getCachedPublicClient()", () => {
    it("returns cached client for indexed chain", () => {
      // Arrange
      const optimismPublicClientMock = {} as CachedPublicClient;

      const client = createLocalPonderClientMock({
        indexedChainIds: new Set([chainIds.Optimism]),
        cachedPublicClients: {
          [`${chainIds.Optimism}`]: optimismPublicClientMock,
        },
      });

      // Act
      const clientRef = client.getCachedPublicClient(chainIds.Optimism);

      // Assert
      expect(clientRef).toBe(optimismPublicClientMock);
    });
  });

  describe("metrics()", () => {
    it("enriches historical indexing metrics", async () => {
      // Arrange
      const metrics: PonderIndexingMetrics = {
        appSettings: {
          command: PonderAppCommands.Dev,
          ordering: PonderIndexingOrderings.Omnichain,
        },
        chains: new Map([
          [
            chainIds.Mainnet,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 10,
            } satisfies ChainIndexingMetricsHistorical,
          ],
          [
            chainIds.Optimism,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earliestBlockRef,
              historicalTotalBlocks: 20,
            } satisfies ChainIndexingMetricsHistorical,
          ],
          [
            chainIds.Base,
            {
              state: ChainIndexingStates.Realtime,
              latestSyncedBlock: earliestBlockRef,
            } satisfies ChainIndexingMetricsRealtime,
          ],
        ]),
      };

      vi.spyOn(PonderClient.prototype, "metrics").mockResolvedValue(metrics);

      const client = createLocalPonderClientMock({
        indexedChainIds: new Set([chainIds.Mainnet, chainIds.Optimism]),
      });

      // Act
      const localMetrics = await client.metrics();

      // Assert
      expect(localMetrics.chains).toStrictEqual(
        new Map([
          [
            chainIds.Mainnet,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earlierBlockRef,
              historicalTotalBlocks: 10,
              backfillEndBlock: 59,
            },
          ],
          [
            chainIds.Optimism,
            {
              state: ChainIndexingStates.Historical,
              latestSyncedBlock: earliestBlockRef,
              historicalTotalBlocks: 20,
              backfillEndBlock: 119,
            },
          ],
        ]),
      );
    });

    it("throws when metrics are missing indexed chains", async () => {
      // Arrange
      const metrics: PonderIndexingMetrics = {
        appSettings: {
          command: PonderAppCommands.Dev,
          ordering: PonderIndexingOrderings.Omnichain,
        },
        chains: new Map([
          [
            chainIds.Mainnet,
            {
              state: ChainIndexingStates.Realtime,
              latestSyncedBlock: latestBlockRef,
            } satisfies ChainIndexingMetricsRealtime,
          ],
        ]),
      };

      vi.spyOn(PonderClient.prototype, "metrics").mockResolvedValue(metrics);

      // Act
      const client = createLocalPonderClientMock();

      // Assert
      await expect(client.metrics()).rejects.toThrowError(
        /Local Ponder Client is missing the Chains Indexing Metrics for indexed chain IDs: 10/,
      );
    });
  });
});
