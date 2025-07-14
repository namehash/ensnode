import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";
import { serializeIndexingStatus } from "./serializer";

describe("Indexing Status", () => {
  describe("Domain serializers", () => {
    it("can serialize IndexingStatus Domain object", () => {
      // arrange: IndexingStatus Domain object
      const indexingStatusDomain: IndexingStatusDomain.IndexingStatus = new Map();

      const chainA = {
        chainId: 3,
        rpcHealth: ENSNode.RPCHealth.Unhealthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
        firstBlockToIndex: {
          number: 123,
          createdAt: new Date(),
        },
        lastIndexedBlock: null,
        lastSyncedBlock: {
          number: 456,
          createdAt: new Date(),
        },
        latestSafeBlock: null,
      } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDomain.BlockInfo>;

      indexingStatusDomain.set(chainA.chainId, chainA);

      const chainB = {
        chainId: 6,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
        firstBlockToIndex: {
          number: 123,
          createdAt: new Date(),
        },
        lastIndexedBlock: {
          number: 333,
          createdAt: new Date(),
        },
        lastSyncedBlock: {
          number: 456,
          createdAt: new Date(),
        },
        latestSafeBlock: {
          number: 789,
          createdAt: new Date(),
        },
      } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDomain.BlockInfo>;

      indexingStatusDomain.set(chainB.chainId, chainB);

      // arrange: expected IndexingStatus DTO object
      const indexingStatusDto: IndexingStatusDTO.IndexingStatus = {
        [`${chainA.chainId}`]: {
          chainId: chainA.chainId,
          rpcHealth: chainA.rpcHealth,
          indexingPhase: chainA.indexingPhase,
          firstBlockToIndex: {
            number: chainA.firstBlockToIndex.number,
            createdAt: chainA.firstBlockToIndex.createdAt.toISOString(),
          },
          lastIndexedBlock: null,
          lastSyncedBlock: {
            number: chainA.lastSyncedBlock.number,
            createdAt: chainA.lastSyncedBlock.createdAt.toISOString(),
          },
          latestSafeBlock: null,
        } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>,
        [`${chainB.chainId}`]: {
          chainId: chainB.chainId,
          rpcHealth: chainB.rpcHealth,
          indexingPhase: chainB.indexingPhase,
          firstBlockToIndex: {
            number: chainB.firstBlockToIndex.number,
            createdAt: chainB.firstBlockToIndex.createdAt.toISOString(),
          },
          lastIndexedBlock: {
            number: 333,
            createdAt: chainB.lastIndexedBlock.createdAt.toISOString(),
          },
          lastSyncedBlock: {
            number: 456,
            createdAt: chainB.lastSyncedBlock.createdAt.toISOString(),
          },
          latestSafeBlock: {
            number: 789,
            createdAt: chainB.latestSafeBlock.createdAt.toISOString(),
          },
        } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>,
      };

      // act & assert
      expect(serializeIndexingStatus(indexingStatusDomain)).toStrictEqual(indexingStatusDto);
    });
  });
});
