/**
 * Ponder Indexing Metrics
 *
 * Defines the structure and validation for the Ponder Indexing Metrics response
 * from `GET /metrics` endpoint.
 * @see https://ponder.sh/docs/advanced/observability#metrics
 */

import { prettifyError, z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { type BlockRef, schemaBlockRef } from "../blocks";
import {
  type ChainIndexingMetrics,
  type ChainIndexingMetricsBackfill,
  type ChainIndexingMetricsCompleted,
  type ChainIndexingMetricsQueued,
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  PonderAppCommands,
  type PonderApplicationSettings,
  type PonderIndexingMetrics,
  PonderIndexingOrderings,
} from "../indexing-metrics";
import { schemaPositiveInteger } from "../numbers";
import { schemaChainIdString } from "./chains";
import { deserializePrometheusMetrics, type PrometheusMetrics } from "./prometheus-metrics-text";
import type { DeepPartial } from "./utils";

const schemaSerializedChainIndexingMetricsQueued = z.object({
  state: z.literal(ChainIndexingStates.Queued),
  backfillTotalBlocks: schemaPositiveInteger,
});

const schemaSerializedChainIndexingMetricsBackfill = z.object({
  state: z.literal(ChainIndexingStates.Backfill),
  backfillTotalBlocks: schemaPositiveInteger,
});

const schemaSerializedChainIndexingMetricsRealtime = z.object({
  state: z.literal(ChainIndexingStates.Realtime),
  latestSyncedBlock: schemaBlockRef,
});

const schemaSerializedChainIndexingMetricsCompleted = z.object({
  state: z.literal(ChainIndexingStates.Completed),
  finalIndexedBlock: schemaBlockRef,
});

/**
 * Schema describing the chain indexing metrics.
 */
const schemaSerializedChainIndexingMetrics = z.discriminatedUnion("state", [
  schemaSerializedChainIndexingMetricsQueued,
  schemaSerializedChainIndexingMetricsBackfill,
  schemaSerializedChainIndexingMetricsRealtime,
  schemaSerializedChainIndexingMetricsCompleted,
]);

/**
 * Schema describing the chains indexing metrics.
 */
const schemaSerializedChainsIndexingMetrics = z.map(
  schemaChainIdString,
  schemaSerializedChainIndexingMetrics,
);

/**
 * Build unvalidated (and perhaps partial) Chain Indexing Metrics
 *
 * @param maybeChainId A string maybe representing a chain ID.
 * @param prometheusMetrics valid Prometheus Metrics from Ponder app.
 * @returns Unvalidated (possibly incomplete) Chain Indexing Metrics
 *          to be validated by {@link schemaSerializedChainIndexingMetrics}.
 */
function buildUnvalidatedChainIndexingMetrics(
  maybeChainId: string,
  prometheusMetrics: PrometheusMetrics,
): DeepPartial<ChainIndexingMetrics> {
  const backfillTotalBlocks = prometheusMetrics.getValue("ponder_historical_total_blocks", {
    chain: maybeChainId,
  });

  const ponderHistoricalCompletedIndexingSeconds = prometheusMetrics.getValue(
    "ponder_historical_completed_indexing_seconds",
    {
      chain: maybeChainId,
    },
  );

  // If no time has been recorded for historical completed indexing,
  // we can assume the chain is still queued to be indexed.
  if (ponderHistoricalCompletedIndexingSeconds === 0) {
    return {
      state: ChainIndexingStates.Queued,
      backfillTotalBlocks,
    } satisfies DeepPartial<ChainIndexingMetricsQueued>;
  }

  const ponderSyncIsComplete = prometheusMetrics.getValue("ponder_sync_is_complete", {
    chain: maybeChainId,
  });

  const ponderSyncIsRealtime = prometheusMetrics.getValue("ponder_sync_is_realtime", {
    chain: maybeChainId,
  });

  const latestSyncedBlockNumber = prometheusMetrics.getValue("ponder_sync_block", {
    chain: maybeChainId,
  });

  const latestSyncedBlockTimestamp = prometheusMetrics.getValue("ponder_sync_block_timestamp", {
    chain: maybeChainId,
  });

  const latestSyncedBlock = {
    number: latestSyncedBlockNumber,
    timestamp: latestSyncedBlockTimestamp,
  } satisfies Partial<BlockRef>;

  // The `ponder_sync_is_complete` metric is set to `1` if, and only if,
  // the indexing has been completed for the chain.
  if (ponderSyncIsComplete === 1) {
    return {
      state: ChainIndexingStates.Completed,
      finalIndexedBlock: latestSyncedBlock,
    } satisfies DeepPartial<ChainIndexingMetricsCompleted>;
  }

  // The `ponder_sync_is_realtime` metric is set to `1` if, and only if,
  // the indexing is currently in realtime for the chain.
  if (ponderSyncIsRealtime === 1) {
    return {
      state: ChainIndexingStates.Realtime,
      latestSyncedBlock,
    } satisfies DeepPartial<ChainIndexingMetricsRealtime>;
  }

  return {
    state: ChainIndexingStates.Backfill,
    backfillTotalBlocks,
  } satisfies DeepPartial<ChainIndexingMetricsBackfill>;
}

function invariant_includesAtLeastOneIndexedChain(
  ctx: ParsePayload<SerializedPonderIndexingMetrics>,
) {
  const { chains } = ctx.value;

  if (chains.size === 0) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: "Ponder Indexing Metrics must include at least one indexed chain.",
    });
  }
}

/**
 * Schema representing settings of a Ponder app.
 */
const schemaSerializedApplicationSettings = z.object({
  command: z.enum(PonderAppCommands),
  ordering: z.enum(PonderIndexingOrderings),
});

/**
 * Schema describing the Ponder Indexing Metrics.
 */
const schemaPonderIndexingMetrics = z
  .object({
    appSettings: schemaSerializedApplicationSettings,
    chains: schemaSerializedChainsIndexingMetrics,
  })
  .check(invariant_includesAtLeastOneIndexedChain);

function invariant_includesRequiredMetrics(ctx: ParsePayload<PrometheusMetrics>) {
  const prometheusMetrics = ctx.value;

  const metricNames = prometheusMetrics.getMetricNames();
  const requiredMetricNames = [
    "ponder_settings_info",
    "ponder_sync_block",
    "ponder_sync_block_timestamp",
    "ponder_historical_completed_indexing_seconds",
    "ponder_historical_total_blocks",
    "ponder_sync_is_complete",
    "ponder_sync_is_realtime",
  ];

  // Validate metrics presence invariants.
  for (const requiredMetricName of requiredMetricNames) {
    // Invariant: Required metric must be present in the Prometheus metrics.
    if (!metricNames.includes(requiredMetricName)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `Missing required Prometheus metric: ${requiredMetricName}`,
      });
    }
  }

  const chainReferences = prometheusMetrics.getLabels("ponder_sync_block", "chain");

  // Validate per-chain invariants.
  for (const chainReference of chainReferences) {
    const ponderHistoricalCompletedIndexingSeconds = prometheusMetrics.getValue(
      "ponder_historical_completed_indexing_seconds",
      { chain: chainReference },
    );

    // Invariant: historical completed indexing seconds must be a non-negative integer.
    if (
      typeof ponderHistoricalCompletedIndexingSeconds !== "number" ||
      !Number.isInteger(ponderHistoricalCompletedIndexingSeconds) ||
      ponderHistoricalCompletedIndexingSeconds < 0
    ) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `'ponder_historical_completed_indexing_seconds' metric for '${chainReference}' chain must be a non-negative integer. Received: ${ponderHistoricalCompletedIndexingSeconds}`,
      });
    }

    const ponderSyncIsComplete = prometheusMetrics.getValue("ponder_sync_is_complete", {
      chain: chainReference,
    });

    const ponderSyncIsRealtime = prometheusMetrics.getValue("ponder_sync_is_realtime", {
      chain: chainReference,
    });

    // Invariant: `ponder_sync_is_complete` and `ponder_sync_is_realtime` cannot
    // both be `1` at the same time.
    if (ponderSyncIsComplete === 1 && ponderSyncIsRealtime === 1) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `'ponder_sync_is_complete' and 'ponder_sync_is_realtime' metrics cannot both be 1 at the same time for chain ${chainReference}`,
      });
    }
  }
}

/**
 * Schema describing the response of fetching `GET /metrics` from a Ponder app.
 */
const schemaSerializedPonderIndexingMetrics = z.coerce
  .string()
  .nonempty({ error: `Ponder Indexing Metrics must be a non-empty string.` })
  .transform(deserializePrometheusMetrics) // deserialize Prometheus metrics text into PrometheusMetrics instance
  .check(invariant_includesRequiredMetrics)
  .transform(buildUnvalidatedPonderIndexingMetrics)
  .pipe(schemaPonderIndexingMetrics);

/**
 * Serialized Ponder Indexing Metrics.
 */
type SerializedPonderIndexingMetrics = z.infer<typeof schemaSerializedPonderIndexingMetrics>;

/**
 * Build unvalidated (and perhaps partial) Ponder Indexing Metrics
 *
 * @param prometheusMetrics valid Prometheus Metrics from Ponder app.
 * @returns Unvalidated (possibly incomplete) Ponder Indexing Metrics
 *          to be validated with {@link schemaSerializedPonderIndexingMetrics}.
 */
function buildUnvalidatedPonderIndexingMetrics(
  prometheusMetrics: PrometheusMetrics,
): DeepPartial<PonderIndexingMetrics> {
  const appSettings = {
    command: prometheusMetrics.getLabel("ponder_settings_info", "command"),
    ordering: prometheusMetrics.getLabel("ponder_settings_info", "ordering"),
  } as DeepPartial<PonderApplicationSettings>;

  const chainReferences = prometheusMetrics.getLabels("ponder_sync_block", "chain");
  const chains = new Map<string, DeepPartial<ChainIndexingMetrics>>();

  for (const maybeChainId of chainReferences) {
    const chainIndexingMetrics = buildUnvalidatedChainIndexingMetrics(
      maybeChainId,
      prometheusMetrics,
    );

    chains.set(maybeChainId, chainIndexingMetrics);
  }

  const unvalidatedPonderIndexingMetrics = {
    appSettings,
    chains,
  };

  return unvalidatedPonderIndexingMetrics;
}

/**
 * Deserialize and validate a Serialized Ponder Indexing Metrics.
 *
 * @param data Maybe a string representing Ponder Indexing Metrics.
 * @returns Deserialized and validated Ponder Indexing Metrics.
 * @throws Error if data cannot be deserialized into a valid Ponder Indexing Metrics.
 */
export function deserializePonderIndexingMetrics(data: string | unknown): PonderIndexingMetrics {
  const validation = schemaSerializedPonderIndexingMetrics.safeParse(data);

  if (!validation.success) {
    throw new Error(
      `Invalid serialized Ponder Indexing Metrics: ${prettifyError(validation.error)}`,
    );
  }

  return validation.data;
}
