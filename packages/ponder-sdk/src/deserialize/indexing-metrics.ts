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
  PonderAppCommands,
  type PonderIndexingMetrics,
  PonderIndexingOrderings,
} from "../indexing-metrics";
import { schemaPositiveInteger } from "../numbers";
import { schemaChainIdString } from "./chains";
import { deserializePrometheusMetrics, type PrometheusMetrics } from "./prometheus-metrics-text";

function invariant_indexingCompletedAndRealtimeAreNotBothTrue(
  ctx: ParsePayload<SerializedChainIndexingMetrics>,
) {
  const data = ctx.value;

  if (data.indexingCompleted && data.indexingRealtime) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message:
        "Chain Indexing Metrics cannot have both `indexingCompleted` and `indexingRealtime` as `true`.",
    });
  }
}

/**
 * Schema describing the chain indexing metrics.
 */
const schemaSerializedChainIndexingMetrics = z
  .object({
    backfillSyncBlocksTotal: schemaPositiveInteger,
    latestSyncedBlock: schemaBlockRef,
    indexingCompleted: z.boolean(),
    indexingRealtime: z.boolean(),
  })
  .check(invariant_indexingCompletedAndRealtimeAreNotBothTrue);

type SerializedChainIndexingMetrics = z.infer<typeof schemaSerializedChainIndexingMetrics>;

/**
 * Schema describing the chains indexing metrics.
 */
const schemaSerializedChainsIndexingMetrics = z.map(
  schemaChainIdString,
  schemaSerializedChainIndexingMetrics,
);

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
    "ponder_historical_total_blocks",
    "ponder_sync_is_complete",
    "ponder_sync_is_realtime",
  ];

  for (const requiredMetricName of requiredMetricNames) {
    if (!metricNames.includes(requiredMetricName)) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        message: `Missing required Prometheus metric: ${requiredMetricName}`,
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
function buildUnvalidatedPonderIndexingMetrics(prometheusMetrics: PrometheusMetrics): unknown {
  const appSettings = {
    command: prometheusMetrics.getLabel("ponder_settings_info", "command"),
    ordering: prometheusMetrics.getLabel("ponder_settings_info", "ordering"),
  };

  const chainReferences = prometheusMetrics.getLabels("ponder_sync_block", "chain");

  const chains = new Map<unknown, unknown>();

  for (const maybeChainId of chainReferences) {
    const latestSyncedBlock = {
      number: prometheusMetrics.getValue("ponder_sync_block", {
        chain: maybeChainId,
      }),
      timestamp: prometheusMetrics.getValue("ponder_sync_block_timestamp", {
        chain: maybeChainId,
      }),
    } satisfies Partial<BlockRef>;

    const backfillSyncBlocksTotal = prometheusMetrics.getValue("ponder_historical_total_blocks", {
      chain: maybeChainId,
    });

    const indexingCompleted =
      prometheusMetrics.getValue("ponder_sync_is_complete", {
        chain: maybeChainId,
      }) === 1;

    const indexingRealtime =
      prometheusMetrics.getValue("ponder_sync_is_realtime", {
        chain: maybeChainId,
      }) === 1;

    chains.set(maybeChainId, {
      latestSyncedBlock,
      backfillSyncBlocksTotal,
      indexingCompleted,
      indexingRealtime,
    });
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
