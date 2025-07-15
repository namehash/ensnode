import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";
import { mapIndexingStatusDtoIntoDomain } from "./dto-to-domain";

describe("Indexing Status", () => {
  describe("DTO mapper", () => {
    it("can map IndexingStatus DTO object into Domain object", () => {
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
      expect(mapIndexingStatusDtoIntoDomain(indexingStatusDto)).toStrictEqual(indexingStatusDomain);
    });

    describe("Indexing Phase: Sync Queued", () => {
      it("can enforce invariants relevant to a chain status permutation: unhealthyRpcAndSyncQueued", () => {
        // Permutation ID: 1
        const unhealthyRpcAndSyncQueued = {
          chainId: 1,
          rpcHealth: ENSNode.RPCHealth.Unhealthy,
          indexingPhase: ENSNode.IndexingPhase.SyncQueued,
          firstBlockToIndex: {
            number: 123,
          },
          lastIndexedBlock: null,
          lastSyncedBlock: null,
          latestSafeBlock: null,
        } satisfies ENSNode.RpcUnhealthyAndSyncQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "1": unhealthyRpcAndSyncQueued,
          }),
        ).not.toThrowError();
      });

      it("can enforce invariants relevant to a chain status permutation: healthyRpcAndSyncQueued", () => {
        // Permutation ID: 2
        const healthyRpcAndSyncQueued = {
          chainId: 2,
          rpcHealth: ENSNode.RPCHealth.Healthy,
          firstBlockToIndex: {
            number: 123,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          indexingPhase: ENSNode.IndexingPhase.SyncQueued,
          lastIndexedBlock: null,
          lastSyncedBlock: null,
          latestSafeBlock: {
            number: 456,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
        } satisfies ENSNode.RpcHealthyAndSyncQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "2": healthyRpcAndSyncQueued,
          }),
        ).not.toThrowError();
      });
    });

    describe("Indexing Phase: Indexing Queued", () => {
      it("can enforce invariants relevant to a chain status permutation: unhealthyRpcAndIndexingQueued", () => {
        // Permutation ID: 3
        const unhealthyRpcAndIndexingQueued = {
          chainId: 3,
          rpcHealth: ENSNode.RPCHealth.Unhealthy,
          indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
          firstBlockToIndex: {
            number: 123,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastIndexedBlock: null,
          lastSyncedBlock: {
            number: 456,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          latestSafeBlock: null,
        } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "3": unhealthyRpcAndIndexingQueued,
          }),
        ).not.toThrowError();

        // test impossible situation: `firstBlockToIndex.number` is after `lastSyncedBlock.number`
        const incorrectChainStatus = {
          ...unhealthyRpcAndIndexingQueued,
          firstBlockToIndex: unhealthyRpcAndIndexingQueued.lastSyncedBlock,
          lastSyncedBlock: unhealthyRpcAndIndexingQueued.firstBlockToIndex,
        } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "3": incorrectChainStatus,
          }),
        ).toThrowError(`Failed to map IndexingStatus DTO: \n✖ Invalid input\n  → at 3\n`);
      });

      it("can enforce invariants relevant to a chain status permutation: healthyRpcAndIndexingQueued", () => {
        // Permutation ID: 4
        const healthyRpcAndIndexingQueued = {
          chainId: 4,
          rpcHealth: ENSNode.RPCHealth.Healthy,
          indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
          firstBlockToIndex: {
            number: 123,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastIndexedBlock: null,
          lastSyncedBlock: {
            number: 456,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          latestSafeBlock: {
            number: 789,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
        } satisfies ENSNode.RpcHealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "4": healthyRpcAndIndexingQueued,
          }),
        ).not.toThrowError();

        // test impossible situation: `firstBlockToIndex.number` is after `lastSyncedBlock.number`
        const incorrectChainStatus = {
          ...healthyRpcAndIndexingQueued,
          firstBlockToIndex: healthyRpcAndIndexingQueued.lastSyncedBlock,
          lastSyncedBlock: healthyRpcAndIndexingQueued.firstBlockToIndex,
        } satisfies ENSNode.RpcHealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "4": incorrectChainStatus,
          }),
        ).toThrowError(`Failed to map IndexingStatus DTO: \n✖ Invalid input\n  → at 4\n`);
      });
    });

    describe("Indexing Phase: Indexing Started", () => {
      it("can enforce invariants relevant to a chain status permutation: unhealthyRpcAndIndexingStarted", () => {
        // Permutation ID: 5
        const unhealthyRpcAndIndexingStarted = {
          chainId: 5,
          rpcHealth: ENSNode.RPCHealth.Unhealthy,
          indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
          firstBlockToIndex: {
            number: 123,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastIndexedBlock: {
            number: 333,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastSyncedBlock: {
            number: 456,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          latestSafeBlock: null,
        } satisfies ENSNode.RpcUnhealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "5": unhealthyRpcAndIndexingStarted,
          }),
        ).not.toThrowError();

        // test impossible situation: `firstBlockToIndex.number` is after `lastSyncedBlock.number`
        let incorrectChainStatus = {
          ...unhealthyRpcAndIndexingStarted,
          firstBlockToIndex: unhealthyRpcAndIndexingStarted.lastSyncedBlock,
          lastSyncedBlock: unhealthyRpcAndIndexingStarted.firstBlockToIndex,
        } satisfies ENSNode.RpcUnhealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "5": incorrectChainStatus,
          }),
        ).toThrowError(`Failed to map IndexingStatus DTO: \n✖ Invalid input\n  → at 5\n`);

        // test impossible situation: `lastSyncedBlock.number` is after `lastIndexedBlock.number`
        incorrectChainStatus = {
          ...unhealthyRpcAndIndexingStarted,
          lastIndexedBlock: unhealthyRpcAndIndexingStarted.lastSyncedBlock,
          lastSyncedBlock: unhealthyRpcAndIndexingStarted.lastIndexedBlock,
        } satisfies ENSNode.RpcUnhealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "5": incorrectChainStatus,
          }),
        ).toThrowError(`Failed to map IndexingStatus DTO: \n✖ Invalid input\n  → at 5\n`);
      });

      it("can enforce invariants relevant to a chain status permutation: healthyRpcAndIndexingStarted", () => {
        // Permutation ID: 6
        const healthyRpcAndIndexingStarted = {
          chainId: 6,
          rpcHealth: ENSNode.RPCHealth.Healthy,
          indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
          firstBlockToIndex: {
            number: 123,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastIndexedBlock: {
            number: 333,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          lastSyncedBlock: {
            number: 456,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
          latestSafeBlock: {
            number: 789,
            createdAt: "2025-07-11T16:54:43.000Z",
          },
        } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "6": healthyRpcAndIndexingStarted,
          }),
        ).not.toThrowError();

        // test impossible situation: `firstBlockToIndex.number` is after `lastSyncedBlock.number`
        const incorrectChainStatus = {
          ...healthyRpcAndIndexingStarted,
          firstBlockToIndex: healthyRpcAndIndexingStarted.lastSyncedBlock,
          lastSyncedBlock: healthyRpcAndIndexingStarted.firstBlockToIndex,
        } satisfies ENSNode.RpcHealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

        expect(() =>
          mapIndexingStatusDtoIntoDomain({
            "6": incorrectChainStatus,
          }),
        ).toThrowError(`Failed to map IndexingStatus DTO: \n✖ Invalid input\n  → at 6\n`);
      });
    });
  });
});
