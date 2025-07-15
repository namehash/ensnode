import { describe, expect, it } from "vitest";
import { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "./types";

describe("Indexing Status", () => {
  describe("Domain types", () => {
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
      } satisfies ENSNode.RpcUnhealthyAndSyncQueued<IndexingStatusDomain.BlockInfo>;

      // Permutation ID: 2
      const healthyRpcAndSyncQueued = {
        chainId: 2,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        firstBlockToIndex: {
          number: 123,
          createdAt: new Date(),
        },
        indexingPhase: ENSNode.IndexingPhase.SyncQueued,
        lastIndexedBlock: null,
        lastSyncedBlock: null,
        latestSafeBlock: {
          number: 456,
          createdAt: new Date(),
        },
      } satisfies ENSNode.RpcHealthyAndSyncQueued<IndexingStatusDomain.BlockInfo>;

      // Permutation ID: 3
      const unhealthyRpcAndIndexingQueued = {
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

      // Permutation ID: 4
      const healthyRpcAndIndexingQueued = {
        chainId: 4,
        rpcHealth: ENSNode.RPCHealth.Healthy,
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
        latestSafeBlock: {
          number: 789,
          createdAt: new Date(),
        },
      } satisfies ENSNode.RpcHealthyAndIndexingQueued<IndexingStatusDomain.BlockInfo>;

      // Permutation ID: 5
      const unhealthyRpcAndIndexingStarted = {
        chainId: 5,
        rpcHealth: ENSNode.RPCHealth.Unhealthy,
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
        latestSafeBlock: null,
      } satisfies ENSNode.RpcUnhealthyAndIndexingStarted<IndexingStatusDomain.BlockInfo>;

      // Permutation ID: 6
      const healthyRpcAndIndexingStarted = {
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

      const indexingStatus: IndexingStatusDomain.IndexingStatus = new Map();

      indexingStatus.set(unhealthyRpcAndSyncQueued.chainId, unhealthyRpcAndSyncQueued);
      indexingStatus.set(healthyRpcAndSyncQueued.chainId, healthyRpcAndSyncQueued);
      indexingStatus.set(unhealthyRpcAndIndexingQueued.chainId, unhealthyRpcAndIndexingQueued);
      indexingStatus.set(healthyRpcAndIndexingQueued.chainId, healthyRpcAndIndexingQueued);
      indexingStatus.set(unhealthyRpcAndIndexingStarted.chainId, unhealthyRpcAndIndexingStarted);
      indexingStatus.set(healthyRpcAndIndexingStarted.chainId, healthyRpcAndIndexingStarted);

      // get chain status by chain ID
      expect(indexingStatus.get(healthyRpcAndSyncQueued.chainId)).toBe(healthyRpcAndSyncQueued);
    });
  });
});
