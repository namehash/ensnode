import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDTO } from "./types";

describe("Indexing Status", () => {
  describe("DTO types", () => {
    it("can express a complete data model", () => {
      /**
       * Below you can find all available permutations for {@link ENSNode.ChainStatus}.
       */

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

      const indexingStatus: IndexingStatusDTO.IndexingStatus = {};

      indexingStatus[unhealthyRpcAndSyncQueued.chainId] = unhealthyRpcAndSyncQueued;
      indexingStatus[healthyRpcAndSyncQueued.chainId] = healthyRpcAndSyncQueued;
      indexingStatus[unhealthyRpcAndIndexingQueued.chainId] = unhealthyRpcAndIndexingQueued;
      indexingStatus[healthyRpcAndIndexingQueued.chainId] = healthyRpcAndIndexingQueued;
      indexingStatus[unhealthyRpcAndIndexingStarted.chainId] = unhealthyRpcAndIndexingStarted;
      indexingStatus[healthyRpcAndIndexingStarted.chainId] = healthyRpcAndIndexingStarted;

      // get chain by chain ID
      expect(indexingStatus[healthyRpcAndSyncQueued.chainId]).toBe(healthyRpcAndSyncQueued);
    });
  });
});
