import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";
import { deserializeIndexingStatus } from "./deserializer";

describe("Indexing Status", () => {
  describe("DTO deserializer", () => {
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
        deserializeIndexingStatus({
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
        deserializeIndexingStatus({
          "2": healthyRpcAndSyncQueued,
        }),
      ).not.toThrowError();
    });

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
        deserializeIndexingStatus({
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
        deserializeIndexingStatus({
          "3": incorrectChainStatus,
        }),
      ).toThrowError(`Failed to parse IndexingStatus DTO: \n✖ Invalid input\n  → at 3\n`);
    });

    it("can enforce invariants relevant to a chain status permutation: unhealthyRpcAndIndexingQueued", () => {
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
        deserializeIndexingStatus({
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
        deserializeIndexingStatus({
          "4": incorrectChainStatus,
        }),
      ).toThrowError(`Failed to parse IndexingStatus DTO: \n✖ Invalid input\n  → at 4\n`);
    });
  });
});

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
