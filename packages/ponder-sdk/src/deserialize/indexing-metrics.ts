/**
 * Ponder Indexing Metrics
 *
 * Defines the structure and validation for the Ponder Indexing Metrics response
 * from `GET /metrics` endpoint.
 * @see https://ponder.sh/docs/advanced/observability#metrics
 */

import { prettifyError, z } from "zod/v4";
import type { ParsePayload } from "zod/v4/core";

import { type BlockRef, blockRefSchema } from "../blocks";
import { type ChainId, chainIdSchema } from "../chains";
import type { PonderIndexingMetrics } from "../indexing-metrics";
import { positiveIntegerSchema } from "../numbers";
import { deserializeChainIdString } from "./chains";
import { PrometheusMetrics } from "./prometheus-metrics-text";

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
    backfillSyncBlocksTotal: positiveIntegerSchema,
    latestSyncedBlock: blockRefSchema,
    indexingCompleted: z.boolean(),
    indexingRealtime: z.boolean(),
  })
  .check(invariant_indexingCompletedAndRealtimeAreNotBothTrue);

type SerializedChainIndexingMetrics = z.infer<typeof schemaSerializedChainIndexingMetrics>;

/**
 * Schema describing the chain indexing metrics.
 */
const schemaSerializedChainsIndexingMetrics = z.map(
  chainIdSchema,
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
  command: z.enum(["dev", "start"]),
  ordering: z.enum(["omnichain"]),
});

/**
 * Schema describing the Ponder Indexing Metrics.
 */
const schemaPonderIndexingMetrics = z
  .object({
    application: schemaSerializedApplicationSettings,
    chains: schemaSerializedChainsIndexingMetrics,
  })
  .check(invariant_includesAtLeastOneIndexedChain);

/**
 * Schema describing the response of fetching `GET /metrics` from a Ponder app.
 */
const schemaSerializedPonderIndexingMetrics = z.coerce
  .string()
  .nonempty({ error: `Ponder Indexing Metrics must be a non-empty string.` })
  .pipe(z.preprocess(buildUnvalidatedPonderIndexingMetrics, schemaPonderIndexingMetrics));

/**
 * Serialized Ponder Indexing Metrics.
 */
type SerializedPonderIndexingMetrics = z.infer<typeof schemaSerializedPonderIndexingMetrics>;

/**
 * Build unvalidated (and perhaps partial) Ponder Indexing Metrics
 * from Prometheus metrics text.
 *
 * @param metricsText prometheus metrics in text format.
 * @returns Unvalidated (possibly incomplete) Ponder Indexing Metrics
 *          to be validated with {@link schemaSerializedPonderIndexingMetrics}.
 */
function buildUnvalidatedPonderIndexingMetrics(metricsText: string): unknown {
  const prometheusMetrics = PrometheusMetrics.parse(metricsText);

  const application = {
    command: prometheusMetrics.getLabel("ponder_settings_info", "command"),
    ordering: prometheusMetrics.getLabel("ponder_settings_info", "ordering"),
  };

  const chainIds = prometheusMetrics
    .getLabels("ponder_sync_block", "chain")
    .map((chainIdString) => deserializeChainIdString(chainIdString));

  const chains = new Map<ChainId, unknown>();

  for (const chainId of chainIds) {
    const latestSyncedBlock = {
      number: prometheusMetrics.getValue("ponder_sync_block", {
        chain: `${chainId.toString()}`,
      }),
      timestamp: prometheusMetrics.getValue("ponder_sync_block_timestamp", {
        chain: `${chainId.toString()}`,
      }),
    } satisfies Partial<BlockRef>;

    const backfillSyncBlocksTotal = prometheusMetrics.getValue("ponder_historical_total_blocks", {
      chain: `${chainId.toString()}`,
    });

    const indexingCompleted =
      prometheusMetrics.getValue("ponder_sync_is_complete", {
        chain: `${chainId.toString()}`,
      }) === 1;

    const indexingRealtime =
      prometheusMetrics.getValue("ponder_sync_is_realtime", {
        chain: `${chainId.toString()}`,
      }) === 1;

    chains.set(chainId, {
      latestSyncedBlock,
      backfillSyncBlocksTotal,
      indexingCompleted,
      indexingRealtime,
    });
  }

  const unvalidatedPonderIndexingMetrics = {
    application,
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
  if (typeof data !== "string") {
    throw new Error(`Ponder Indexing Metrics data must be a string.`);
  }

  const validation = schemaSerializedPonderIndexingMetrics.safeParse(data);

  if (!validation.success) {
    throw new Error(
      `Invalid serialized Ponder Indexing Metrics: ${prettifyError(validation.error)}`,
    );
  }

  return validation.data;
}
