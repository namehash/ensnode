import { describe, expect, it } from "vitest";
import { ENSNode } from "../../types";
import { IndexingStatusDTO } from "./types";

describe("Indexing Status", () => {
  describe("DTO layer", () => {
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
      } satisfies ENSNode.RpcUnhealthyAndSyncQueued<IndexingStatusDTO.BlockInfo>;

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
      } satisfies ENSNode.RpcHealthyAndSyncQueued<IndexingStatusDTO.BlockInfo>;

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
      } satisfies ENSNode.RpcUnhealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

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
      } satisfies ENSNode.RpcHealthyAndIndexingQueued<IndexingStatusDTO.BlockInfo>;

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
      } satisfies ENSNode.RpcUnhealthyAndIndexingStarted<IndexingStatusDTO.BlockInfo>;

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
