/**
 * Build Indexing Status
 *
 * This file includes ideas and functionality integrating Ponder Metadata
 * with ENSIndexer application. Here all Ponder Metadata concepts, such as
 * - chain configuration from `ponder.config.ts` file,
 * - metrics from `/metrics` endpoint,
 * - publicClients from `ponder:api` import,
 * - status from `/status` endpoint,
 * all turn into the ENSIndexer data model.
 */

import config from "@/config";

import {
  type CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
  type OmnichainIndexingStatusSnapshot,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";
import { PonderClient } from "@ensnode/ponder-sdk";

import { LocalPonderClient } from "../../../ponder/local-client";

const localPonderClient = new LocalPonderClient(new PonderClient(config.ensIndexerUrl));

export async function buildOmnichainIndexingStatusSnapshot(): Promise<OmnichainIndexingStatusSnapshot> {
  return localPonderClient.buildCrossChainIndexingStatusSnapshot();
}

export function createCrossChainIndexingStatusSnapshotOmnichain(
  omnichainSnapshot: OmnichainIndexingStatusSnapshot,
  snapshotTime: UnixTimestamp,
): CrossChainIndexingStatusSnapshotOmnichain {
  return {
    strategy: CrossChainIndexingStrategyIds.Omnichain,
    slowestChainIndexingCursor: omnichainSnapshot.omnichainIndexingCursor,
    snapshotTime,
    omnichainSnapshot,
  };
}
