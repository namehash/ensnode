import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";
import { deserializeIndexingStatus } from "./deserializers";

describe("Indexing Status", () => {
  describe("DTO deserializers", () => {
    it("can deserialize IndexingStatus DTO object", () => {
      // arrange: IndexingStatus DTO object
      const indexingStatusDto = {} as IndexingStatusDTO.IndexingStatus;

      const chainA = {
        chainId: 3,
        rpcHealth: ENSNode.RPCHealth.Unhealthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
        firstBlockToIndex: {
          number: 123,
          createdAt: new Date().toISOString(),
        },
        lastIndexedBlock: null,
        lastSyncedBlock: {
          number: 456,
          createdAt: new Date().toISOString(),
        },
        latestSafeBlock: null,
      } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

      indexingStatusDto[`${chainA.chainId}`] = chainA;

      const chainB = {
        chainId: 6,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
        firstBlockToIndex: {
          number: 123,
          createdAt: new Date().toISOString(),
        },
        lastIndexedBlock: {
          number: 333,
          createdAt: new Date().toISOString(),
        },
        lastSyncedBlock: {
          number: 456,
          createdAt: new Date().toISOString(),
        },
        latestSafeBlock: {
          number: 789,
          createdAt: new Date().toISOString(),
        },
      } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

      indexingStatusDto[`${chainB.chainId}`] = chainB;

      // arrange: expected IndexingStatus Domain object
      const indexingStatusDomain: IndexingStatusDomain.IndexingStatus = new Map([
        [
          chainA.chainId,
          {
            chainId: chainA.chainId,
            rpcHealth: chainA.rpcHealth,
            indexingPhase: chainA.indexingPhase,
            firstBlockToIndex: {
              number: 123,
              createdAt: new Date(chainA.firstBlockToIndex.createdAt),
            },
            lastIndexedBlock: null,
            lastSyncedBlock: {
              number: 456,
              createdAt: new Date(chainA.lastSyncedBlock.createdAt),
            },
            latestSafeBlock: null,
          } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDomain.BlockInfo>,
        ],
        [
          chainB.chainId,
          {
            chainId: chainB.chainId,
            rpcHealth: chainB.rpcHealth,
            indexingPhase: chainB.indexingPhase,
            firstBlockToIndex: {
              number: chainB.firstBlockToIndex.number,
              createdAt: new Date(chainB.firstBlockToIndex.createdAt),
            },
            lastIndexedBlock: {
              number: chainB.lastIndexedBlock.number,
              createdAt: new Date(chainB.lastIndexedBlock.createdAt),
            },
            lastSyncedBlock: {
              number: chainB.lastSyncedBlock.number,
              createdAt: new Date(chainB.lastSyncedBlock.createdAt),
            },
            latestSafeBlock: {
              number: chainB.latestSafeBlock.number,
              createdAt: new Date(chainB.latestSafeBlock.createdAt),
            },
          } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDomain.BlockInfo>,
        ],
      ]);

      // act & assert
      expect(deserializeIndexingStatus(indexingStatusDto)).toStrictEqual(indexingStatusDomain);
    });
  });
});
