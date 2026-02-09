import {
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  PonderAppCommands,
  type PonderIndexingMetrics,
  PonderIndexingOrderings,
} from "../indexing-metrics";

export const indexingMetricsMockValid = {
  text: `
# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="omnichain",database="postgres",command="start"} 1

# HELP ponder_sync_block Closest-to-tip synced block number
# TYPE ponder_sync_block gauge
ponder_sync_block{chain="10"} 147268938
ponder_sync_block{chain="1"} 24377568
ponder_sync_block{chain="8453"} 41673653
ponder_sync_block{chain="534352"} 29373405
ponder_sync_block{chain="42161"} 428248999
ponder_sync_block{chain="59144"} 28584906

# HELP ponder_sync_block_timestamp Closest-to-tip synced block timestamp
# TYPE ponder_sync_block_timestamp gauge
ponder_sync_block_timestamp{chain="10"} 1770136653
ponder_sync_block_timestamp{chain="1"} 1770136655
ponder_sync_block_timestamp{chain="8453"} 1770136653
ponder_sync_block_timestamp{chain="534352"} 1770136654
ponder_sync_block_timestamp{chain="42161"} 1770136654
ponder_sync_block_timestamp{chain="59144"} 1770136654

# HELP ponder_sync_is_realtime Boolean (0 or 1) indicating if the sync is realtime mode
# TYPE ponder_sync_is_realtime gauge
ponder_sync_is_realtime{chain="42161"} 1
ponder_sync_is_realtime{chain="534352"} 1
ponder_sync_is_realtime{chain="10"} 1
ponder_sync_is_realtime{chain="1"} 1
ponder_sync_is_realtime{chain="59144"} 1
ponder_sync_is_realtime{chain="8453"} 1

# HELP ponder_sync_is_complete Boolean (0 or 1) indicating if the sync has synced all blocks
# TYPE ponder_sync_is_complete gauge

# HELP ponder_historical_total_blocks Number of blocks required for the historical sync
# TYPE ponder_historical_total_blocks gauge
ponder_historical_total_blocks{chain="10"} 36827849
ponder_historical_total_blocks{chain="1"} 21042285
ponder_historical_total_blocks{chain="8453"} 24103899
ponder_historical_total_blocks{chain="534352"} 12693186
ponder_historical_total_blocks{chain="42161"} 78607197
ponder_historical_total_blocks{chain="59144"} 21873991
`,
  deserialized: {
    appSettings: { ordering: PonderIndexingOrderings.Omnichain, command: PonderAppCommands.Start },
    chains: new Map([
      [
        10,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 147268938, timestamp: 1770136653 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
      [
        1,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 24377568, timestamp: 1770136655 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
      [
        8453,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 41673653, timestamp: 1770136653 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
      [
        534352,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 29373405, timestamp: 1770136654 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
      [
        42161,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 428248999, timestamp: 1770136654 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
      [
        59144,
        {
          state: ChainIndexingStates.Realtime,
          latestSyncedBlock: { number: 28584906, timestamp: 1770136654 },
        } satisfies ChainIndexingMetricsRealtime,
      ],
    ]),
  } satisfies PonderIndexingMetrics,
};

export const indexingMetricsMockInvalidNonIntegerChainNames = {
  text: `
# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="omnichain",database="postgres",command="start"} 1

# HELP ponder_sync_block Closest-to-tip synced block number
# TYPE ponder_sync_block gauge
ponder_sync_block{chain="optimism"} 147268938
ponder_sync_block{chain="mainnet"} 24377568
ponder_sync_block{chain="base"} 41673653
ponder_sync_block{chain="scroll"} 29373405
ponder_sync_block{chain="arbitrum"} 428248999
ponder_sync_block{chain="linea"} 28584906

# HELP ponder_sync_block_timestamp Closest-to-tip synced block timestamp
# TYPE ponder_sync_block_timestamp gauge
ponder_sync_block_timestamp{chain="optimism"} 1770136653
ponder_sync_block_timestamp{chain="mainnet"} 1770136655
ponder_sync_block_timestamp{chain="base"} 1770136653
ponder_sync_block_timestamp{chain="scroll"} 1770136654
ponder_sync_block_timestamp{chain="arbitrum"} 1770136654
ponder_sync_block_timestamp{chain="linea"} 1770136654

# HELP ponder_sync_is_realtime Boolean (0 or 1) indicating if the sync is realtime mode
# TYPE ponder_sync_is_realtime gauge
ponder_sync_is_realtime{chain="arbitrum"} 1
ponder_sync_is_realtime{chain="scroll"} 1
ponder_sync_is_realtime{chain="optimism"} 1
ponder_sync_is_realtime{chain="mainnet"} 1
ponder_sync_is_realtime{chain="linea"} 1
ponder_sync_is_realtime{chain="base"} 1

# HELP ponder_sync_is_complete Boolean (0 or 1) indicating if the sync has synced all blocks
# TYPE ponder_sync_is_complete gauge

# HELP ponder_historical_total_blocks Number of blocks required for the historical sync
# TYPE ponder_historical_total_blocks gauge
ponder_historical_total_blocks{chain="optimism"} 36827849
ponder_historical_total_blocks{chain="mainnet"} 21042285
ponder_historical_total_blocks{chain="base"} 24103899
ponder_historical_total_blocks{chain="scroll"} 12693186
ponder_historical_total_blocks{chain="arbitrum"} 78607197
ponder_historical_total_blocks{chain="linea"} 21873991`,
};

export const indexingMetricsMockInvalidApplicationSettingsOrdering = {
  text: `
# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="invalid_ordering",database="postgres",command="dev"} 1
`,
};

export const indexingMetricsMockInvalidNoIndexedChains = {
  text: `
# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="omnichain",database="postgres",command="start"} 1

# HELP ponder_sync_block Closest-to-tip synced block number
# TYPE ponder_sync_block gauge
`,
};

/**
 * This mock has conflicting metrics that should cause validation to fail.
 *
 * These metrics must not be set to `1` at the same time:
 * - `ponder_sync_is_complete` (when set to `1`, indicates indexing has been completed and no more syncing is needed)
 * - `ponder_sync_is_realtime` (when set to `1`, indicates indexing is in realtime mode and actively syncing new blocks)
 */
export const indexingMetricsMockInvalidConflictingMetrics = {
  text: `
# HELP ponder_settings_info Ponder settings information
# TYPE ponder_settings_info gauge
ponder_settings_info{ordering="omnichain",database="postgres",command="start"} 1

# HELP ponder_sync_block Closest-to-tip synced block number
# TYPE ponder_sync_block gauge
ponder_sync_block{chain="10"} 147268938
ponder_sync_block{chain="1"} 24377568
ponder_sync_block{chain="8453"} 41673653
ponder_sync_block{chain="534352"} 29373405
ponder_sync_block{chain="42161"} 428248999
ponder_sync_block{chain="59144"} 28584906

# HELP ponder_sync_block_timestamp Closest-to-tip synced block timestamp
# TYPE ponder_sync_block_timestamp gauge
ponder_sync_block_timestamp{chain="10"} 1770136653
ponder_sync_block_timestamp{chain="1"} 1770136655
ponder_sync_block_timestamp{chain="8453"} 1770136653
ponder_sync_block_timestamp{chain="534352"} 1770136654
ponder_sync_block_timestamp{chain="42161"} 1770136654
ponder_sync_block_timestamp{chain="59144"} 1770136654

# HELP ponder_sync_is_realtime Boolean (0 or 1) indicating if the sync is realtime mode
# TYPE ponder_sync_is_realtime gauge
ponder_sync_is_realtime{chain="42161"} 1
ponder_sync_is_realtime{chain="534352"} 1
ponder_sync_is_realtime{chain="10"} 1
ponder_sync_is_realtime{chain="1"} 1
ponder_sync_is_realtime{chain="59144"} 1
ponder_sync_is_realtime{chain="8453"} 1

ponder_sync_is_complete{chain="42161"} 1
ponder_sync_is_complete{chain="534352"} 1
ponder_sync_is_complete{chain="10"} 1
ponder_sync_is_complete{chain="1"} 1
ponder_sync_is_complete{chain="59144"} 1
ponder_sync_is_complete{chain="8453"} 1

# HELP ponder_sync_is_complete Boolean (0 or 1) indicating if the sync has synced all blocks
# TYPE ponder_sync_is_complete gauge

# HELP ponder_historical_total_blocks Number of blocks required for the historical sync
# TYPE ponder_historical_total_blocks gauge
ponder_historical_total_blocks{chain="10"} 36827849
ponder_historical_total_blocks{chain="1"} 21042285
ponder_historical_total_blocks{chain="8453"} 24103899
ponder_historical_total_blocks{chain="534352"} 12693186
ponder_historical_total_blocks{chain="42161"} 78607197
ponder_historical_total_blocks{chain="59144"} 21873991
`,
};
