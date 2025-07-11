import { describe, expect, it } from "vitest";
import { ENSNode } from "./types";

describe("Indexing Status", () => {
  describe("Domain layer", () => {
    type BlockInfo = ENSNode.Domain.BlockInfo;

    it("can express a complete data model", () => {
      // permutations defined: https://docs.google.com/spreadsheets/d/1BresRxwVBquMftKtmdRL7aayYtwy-MN0BWQMg9aufkU/edit?gid=0#gid=0

      // ID: 1
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
      } satisfies ENSNode.RpcUnhealthyAndSyncQueued<BlockInfo>;

      // ID: 2
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
      } satisfies ENSNode.RpcHealthyAndSyncQueued<BlockInfo>;

      // ID: 3
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
      } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<BlockInfo>;

      // ID: 4
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
      } satisfies ENSNode.RpcHealthyAndIndexingQueued<BlockInfo>;

      // ID: 5
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
      } satisfies ENSNode.RpcUnhealthyAndIndexing<BlockInfo>;

      // ID: 6
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
      } satisfies ENSNode.RpcHealthyAndIndexing<BlockInfo>;

      const indexingStatus: ENSNode.Domain.IndexingStatus = new Map();

      indexingStatus.set(unhealthyRpcAndSyncQueued.chainId, unhealthyRpcAndSyncQueued);
      indexingStatus.set(healthyRpcAndSyncQueued.chainId, healthyRpcAndSyncQueued);
      indexingStatus.set(unhealthyRpcAndIndexingQueued.chainId, unhealthyRpcAndIndexingQueued);
      indexingStatus.set(healthyRpcAndIndexingQueued.chainId, healthyRpcAndIndexingQueued);
      indexingStatus.set(unhealthyRpcAndIndexingStarted.chainId, unhealthyRpcAndIndexingStarted);
      indexingStatus.set(healthyRpcAndIndexingStarted.chainId, healthyRpcAndIndexingStarted);

      // get chain by chain ID
      expect(indexingStatus.get(healthyRpcAndSyncQueued.chainId)).toBe(healthyRpcAndSyncQueued);
    });
  });

  describe("DTO layer", () => {
    type BlockInfo = ENSNode.DTO.BlockInfo;

    it("can express a complete data model", () => {
      // permutations defined: https://docs.google.com/spreadsheets/d/1BresRxwVBquMftKtmdRL7aayYtwy-MN0BWQMg9aufkU/edit?gid=0#gid=0

      // ID: 1
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
      } satisfies ENSNode.RpcUnhealthyAndSyncQueued<BlockInfo>;

      // ID: 2
      const healthyRpcAndSyncQueued = {
        chainId: 2,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        firstBlockToIndex: {
          number: 123,
          createdAt: 1752252883,
        },
        indexingPhase: ENSNode.IndexingPhase.SyncQueued,
        lastIndexedBlock: null,
        lastSyncedBlock: null,
        latestSafeBlock: {
          number: 456,
          createdAt: 1752252883,
        },
      } satisfies ENSNode.RpcHealthyAndSyncQueued<BlockInfo>;

      // ID: 3
      const unhealthyRpcAndIndexingQueued = {
        chainId: 3,
        rpcHealth: ENSNode.RPCHealth.Unhealthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
        firstBlockToIndex: {
          number: 123,
          createdAt: 1752252883,
        },
        lastIndexedBlock: null,
        lastSyncedBlock: {
          number: 456,
          createdAt: 1752252883,
        },
        latestSafeBlock: null,
      } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<BlockInfo>;

      // ID: 4
      const healthyRpcAndIndexingQueued = {
        chainId: 4,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingQueued,
        firstBlockToIndex: {
          number: 123,
          createdAt: 1752252883,
        },
        lastIndexedBlock: null,
        lastSyncedBlock: {
          number: 456,
          createdAt: 1752252883,
        },
        latestSafeBlock: {
          number: 789,
          createdAt: 1752252883,
        },
      } satisfies ENSNode.RpcHealthyAndIndexingQueued<BlockInfo>;

      // ID: 5
      const unhealthyRpcAndIndexingStarted = {
        chainId: 5,
        rpcHealth: ENSNode.RPCHealth.Unhealthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
        firstBlockToIndex: {
          number: 123,
          createdAt: 1752252883,
        },
        lastIndexedBlock: {
          number: 333,
          createdAt: 1752252883,
        },
        lastSyncedBlock: {
          number: 456,
          createdAt: 1752252883,
        },
        latestSafeBlock: null,
      } satisfies ENSNode.RpcUnhealthyAndIndexing<BlockInfo>;

      // ID: 6
      const healthyRpcAndIndexingStarted = {
        chainId: 6,
        rpcHealth: ENSNode.RPCHealth.Healthy,
        indexingPhase: ENSNode.IndexingPhase.IndexingStarted,
        firstBlockToIndex: {
          number: 123,
          createdAt: 1752252883,
        },
        lastIndexedBlock: {
          number: 333,
          createdAt: 1752252883,
        },
        lastSyncedBlock: {
          number: 456,
          createdAt: 1752252883,
        },
        latestSafeBlock: {
          number: 789,
          createdAt: 1752252883,
        },
      } satisfies ENSNode.RpcHealthyAndIndexing<BlockInfo>;

      const indexingStatus: ENSNode.DTO.IndexingStatus = {};

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
