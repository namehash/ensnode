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
import { type ChainId, type ChainIdString, schemaChainId } from "../chains";
import {
  type ChainIndexingMetrics,
  type ChainIndexingMetricsCompleted,
  type ChainIndexingMetricsHistorical,
  type ChainIndexingMetricsRealtime,
  ChainIndexingStates,
  type PonderAppCommand,
  PonderAppCommands,
  type PonderIndexingMetrics,
  type PonderIndexingOrdering,
  PonderIndexingOrderings,
} from "../indexing-metrics";
import { schemaPositiveInteger } from "../numbers";
import { schemaChainIdString } from "./chains";
import { deserializePrometheusMetrics, type PrometheusMetrics } from "./prometheus-metrics-text";
import type { Unvalidated } from "./utils";

const schemaChainIndexingMetricsHistorical = z.object({
  state: z.literal(ChainIndexingStates.Historical),
  latestSyncedBlock: schemaBlockRef,
  historicalTotalBlocks: schemaPositiveInteger,
});

const schemaChainIndexingMetricsRealtime = z.object({
  state: z.literal(ChainIndexingStates.Realtime),
  latestSyncedBlock: schemaBlockRef,
});

const schemaChainIndexingMetricsCompleted = z.object({
  state: z.literal(ChainIndexingStates.Completed),
  finalIndexedBlock: schemaBlockRef,
});

/**
 * Schema describing the chain indexing metrics.
 */
const schemaChainIndexingMetrics = z.discriminatedUnion("state", [
  schemaChainIndexingMetricsHistorical,
  schemaChainIndexingMetricsRealtime,
  schemaChainIndexingMetricsCompleted,
]);

/**
 * Schema describing the chains indexing metrics.
 */
const schemaChainsIndexingMetrics = z.map(schemaChainId, schemaChainIndexingMetrics);

function invariant_indexingCompletedAndRealtimeAreNotBothTrue(
  ctx: ParsePayload<PrometheusMetrics>,
) {
  const prometheusMetrics = ctx.value;
  const chainReferences = prometheusMetrics.getLabels("ponder_sync_block", "chain");

  for (const maybeChainId of chainReferences) {
    const ponderSyncIsComplete = prometheusMetrics.getValue("ponder_sync_is_complete", {
      chain: maybeChainId,
    });

    const ponderSyncIsRealtime = prometheusMetrics.getValue("ponder_sync_is_realtime", {
      chain: maybeChainId,
    });

    if (ponderSyncIsComplete === 1 && ponderSyncIsRealtime === 1) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `'ponder_sync_is_complete' and 'ponder_sync_is_realtime' metrics cannot both be 1 at the same time for chain ${maybeChainId}`,
      });
    }
  }
}

function invariant_includesRequiredMetrics(ctx: ParsePayload<PrometheusMetrics>) {
  const prometheusMetrics = ctx.value;

  const metricNames = prometheusMetrics.getMetricNames();
  const requiredChainMetricNames = [
    "ponder_sync_block",
    "ponder_sync_block_timestamp",
    "ponder_historical_total_blocks",
  ];
  const requiredMetricNames = ["ponder_settings_info", ...requiredChainMetricNames];

  // Invariant: All required metrics must be present in the Prometheus metrics text.
  for (const requiredMetricName of requiredMetricNames) {
    if (!metricNames.includes(requiredMetricName)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `Missing required Prometheus metric: ${requiredMetricName}`,
      });
    }
  }

  // Invariant: All required chain metrics must include a 'chain' label.
  for (const requiredChainMetricName of requiredChainMetricNames) {
    const metricLabels = prometheusMetrics.getLabels(requiredChainMetricName, "chain");

    if (metricLabels.length === 0) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `At least one '${requiredChainMetricName}' metric must include a 'chain' label.`,
      });
    }

    // Invariant: All values in the 'chain' label of required chain metrics must be valid ChainId strings.
    for (const maybeChainId of metricLabels) {
      const result = schemaChainIdString.safeParse(maybeChainId);

      if (!result.success) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          message: `Value in 'chain' label of '${requiredChainMetricName}' metric must be a string representing a valid ChainId, but got: '${maybeChainId}'`,
        });
      }
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
  .check(invariant_indexingCompletedAndRealtimeAreNotBothTrue);

function invariant_includesAtLeastOneIndexedChain(ctx: ParsePayload<PonderIndexingMetrics>) {
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
const schemaApplicationSettings = z.object({
  command: z.enum(PonderAppCommands),
  ordering: z.enum(PonderIndexingOrderings),
});

/**
 * Schema describing Ponder Indexing Metrics.
 */
const schemaPonderIndexingMetrics = z
  .object({
    appSettings: schemaApplicationSettings,
    chains: schemaChainsIndexingMetrics,
  })
  .check(invariant_includesAtLeastOneIndexedChain);

/**
 * Build unvalidated Chain Indexing Metrics
 *
 * @param chainId Chain ID
 * @param prometheusMetrics valid Prometheus Metrics from Ponder app.
 * @returns Unvalidated Chain Indexing Metrics
 *          to be validated by {@link schemaChainIndexingMetrics}.
 */
function buildUnvalidatedChainIndexingMetrics(
  chainIdString: ChainIdString,
  prometheusMetrics: PrometheusMetrics,
): Unvalidated<ChainIndexingMetrics> {
  const ponderSyncIsComplete = prometheusMetrics.getValue("ponder_sync_is_complete", {
    chain: chainIdString,
  });

  const ponderSyncIsRealtime = prometheusMetrics.getValue("ponder_sync_is_realtime", {
    chain: chainIdString,
  });

  const latestSyncedBlockNumber = prometheusMetrics.getValue("ponder_sync_block", {
    chain: chainIdString,
  });

  const latestSyncedBlockTimestamp = prometheusMetrics.getValue("ponder_sync_block_timestamp", {
    chain: chainIdString,
  });

  const latestSyncedBlock = {
    number: latestSyncedBlockNumber,
    timestamp: latestSyncedBlockTimestamp,
  } satisfies Unvalidated<BlockRef>;

  // The `ponder_sync_is_complete` metric is set to `1` if, and only if,
  // the indexing has been completed for the chain.
  if (ponderSyncIsComplete === 1) {
    return {
      state: ChainIndexingStates.Completed,
      finalIndexedBlock: latestSyncedBlock,
    } satisfies Unvalidated<ChainIndexingMetricsCompleted>;
  }

  // The `ponder_sync_is_realtime` metric is set to `1` if, and only if,
  // the indexing is currently in realtime for the chain.
  if (ponderSyncIsRealtime === 1) {
    return {
      state: ChainIndexingStates.Realtime,
      latestSyncedBlock,
    } satisfies Unvalidated<ChainIndexingMetricsRealtime>;
  }

  const historicalTotalBlocks = prometheusMetrics.getValue("ponder_historical_total_blocks", {
    chain: chainIdString,
  });

  return {
    state: ChainIndexingStates.Historical,
    historicalTotalBlocks,
    latestSyncedBlock,
  } satisfies Unvalidated<ChainIndexingMetricsHistorical>;
}

/**
 * Build unvalidated Ponder Indexing Metrics
 *
 * @param prometheusMetrics valid Prometheus Metrics from Ponder app.
 * @returns Unvalidated Ponder Indexing Metrics
 *          to be validated with {@link schemaPonderIndexingMetrics}.
 */
function buildUnvalidatedPonderIndexingMetrics(
  prometheusMetrics: PrometheusMetrics,
): Unvalidated<PonderIndexingMetrics> {
  const appSettings = {
    command: prometheusMetrics.getLabel(
      "ponder_settings_info",
      "command",
    ) as Unvalidated<PonderAppCommand>,
    ordering: prometheusMetrics.getLabel(
      "ponder_settings_info",
      "ordering",
    ) as Unvalidated<PonderIndexingOrdering>,
  };

  const chainReferences = prometheusMetrics.getLabels(
    "ponder_sync_block",
    "chain",
  ) satisfies ChainIdString[];

  const chains = new Map<Unvalidated<ChainId>, Unvalidated<ChainIndexingMetrics>>();

  for (const chainIdString of chainReferences) {
    const chainIndexingMetrics = buildUnvalidatedChainIndexingMetrics(
      chainIdString,
      prometheusMetrics,
    );

    const chainId = Number(chainIdString) satisfies Unvalidated<ChainId>;

    chains.set(chainId, chainIndexingMetrics);
  }

  return {
    appSettings,
    chains,
  };
}

/**
 * Deserialize and validate a Serialized Ponder Indexing Metrics.
 *
 * @param ponderMetricsText Raw text maybe including Prometheus metrics.
 * @returns Deserialized and validated Ponder Indexing Metrics.
 * @throws Error if data cannot be deserialized into a valid Ponder Indexing Metrics.
 */
export function deserializePonderIndexingMetrics(ponderMetricsText: string): PonderIndexingMetrics {
  const validation = schemaSerializedPonderIndexingMetrics
    .transform(buildUnvalidatedPonderIndexingMetrics)
    .pipe(schemaPonderIndexingMetrics)
    .safeParse(ponderMetricsText);

  if (!validation.success) {
    throw new Error(
      `Invalid serialized Ponder Indexing Metrics: ${prettifyError(validation.error)}`,
    );
  }

  return validation.data;
}
