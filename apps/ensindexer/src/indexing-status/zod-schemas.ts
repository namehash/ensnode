/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import {
  ChainIdString,
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingNotStartedStatus,
  ChainIndexingStatus,
  Duration,
  deserializeENSIndexerIndexingStatus,
} from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeNonNegativeIntegerSchema,
} from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";

const makeChainNameSchema = (indexedChainNames: string[]) => z.enum(indexedChainNames);

const PonderBlockRefSchema = makeBlockRefSchema();

const PonderChainStatus = z.object({
  chainId: makeChainIdSchema(),
  block: PonderBlockRefSchema,
});

const PonderCommandSchema = z.enum(["dev", "start"]);

const PonderOrderingSchema = z.literal("omnichain");

const PonderAppSettingsSchema = z.strictObject({
  command: PonderCommandSchema,
  ordering: PonderOrderingSchema,
});

const PonderMetricBooleanSchema = z.coerce.string().transform((v) => v === "1");

const PonderMetricIntegerSchema = z.coerce.number().pipe(makeNonNegativeIntegerSchema());

const PonderMetricSchema = z.object({
  isSyncComplete: PonderMetricBooleanSchema,
  isSyncRealtime: PonderMetricBooleanSchema,
  syncBlock: PonderBlockRefSchema,

  historicalTotalBlocks: PonderMetricIntegerSchema,
  historicalCachedBlocks: PonderMetricIntegerSchema,
  historicalCompletedBlocks: PonderMetricIntegerSchema,
});

const PonderChainBlockRefsSchema = z.object({
  config: z.object({
    startBlock: PonderBlockRefSchema,
    endBlock: PonderBlockRefSchema.nullable(),
  }),
  backfillEndBlock: PonderBlockRefSchema,
});

export const makePonderIndexingStatusSchema = (indexedChainNames: string[]) => {
  const ChainNameSchema = makeChainNameSchema(indexedChainNames);

  return z
    .object({
      appSettings: PonderAppSettingsSchema,

      chainsBlockRefs: z
        .record(ChainNameSchema, PonderChainBlockRefsSchema)
        .refine((v) => indexedChainNames.every((chainName) => Object.keys(v).includes(chainName)), {
          error: "All `indexedChainNames` must be represented by Ponder Chains Block Refs object.",
        }),

      chainsMetrics: z
        .record(ChainNameSchema, PonderMetricSchema)
        .refine((v) => indexedChainNames.every((chainName) => Object.keys(v).includes(chainName)), {
          error: "All `indexedChainNames` must be represented by Ponder Chains Metrics object.",
        }),

      chainsStatuses: z
        .record(ChainNameSchema, PonderChainStatus)
        .refine((v) => indexedChainNames.every((chainName) => Object.keys(v).includes(chainName)), {
          error: "All `indexedChainNames` must be represented by Ponder Chains Status object.",
        }),
    })
    .transform((v) => {
      const serializedChainIndexingStatuses = {} as Record<ChainIdString, ChainIndexingStatus>;

      for (const chainName of indexedChainNames) {
        const { chainsBlockRefs, chainsMetrics, chainsStatuses } = v;

        const ponderChainBlockRefs = chainsBlockRefs[chainName]!;
        const ponderChainMetrics = chainsMetrics[chainName]!;
        const ponderChainStatus = chainsStatuses[chainName]!;

        const { chainId, block: chainStatusBlock } = ponderChainStatus;
        const {
          historicalCompletedBlocks,
          historicalTotalBlocks,
          isSyncComplete,
          isSyncRealtime,
          syncBlock: chainSyncBlock,
        } = ponderChainMetrics;
        const { config: chainBlocksConfig, backfillEndBlock: chainBackfillEndBlock } =
          ponderChainBlockRefs;

        // In omnichain ordering, if the startBlock is the same as the
        // status block, the chain has not started yet.
        if (chainBlocksConfig.startBlock.number === chainStatusBlock.number) {
          serializedChainIndexingStatuses[`${chainId}`] = {
            status: "notStarted",
            config: {
              startBlock: chainBlocksConfig.startBlock,
              endBlock: chainBlocksConfig.endBlock,
            },
          } satisfies ChainIndexingNotStartedStatus;

          // go to next iteration
          continue;
        }

        if (isSyncComplete) {
          serializedChainIndexingStatuses[`${chainId}`] = {
            status: "completed",
            config: {
              startBlock: chainBlocksConfig.startBlock,
              endBlock: chainBlocksConfig.endBlock,
            },
            latestIndexedBlock: chainStatusBlock,
            latestKnownBlock: chainStatusBlock,
          } satisfies ChainIndexingCompletedStatus;

          // go to next iteration
          continue;
        }

        const nowUnixTimestamp = Math.floor(Date.now() / 1000);
        const approximateRealtimeDistance: Duration = Math.max(
          0,
          nowUnixTimestamp - chainStatusBlock.timestamp,
        );

        if (isSyncRealtime) {
          serializedChainIndexingStatuses[`${chainId}`] = {
            status: "following",
            config: {
              startBlock: chainBlocksConfig.startBlock,
            },
            latestIndexedBlock: chainStatusBlock,
            latestKnownBlock: chainSyncBlock,
            approximateRealtimeDistance,
          } satisfies ChainIndexingFollowingStatus;

          // go to next iteration
          continue;
        }

        serializedChainIndexingStatuses[`${chainId}`] = {
          status: "backfill",
          config: {
            startBlock: chainBlocksConfig.startBlock,
            endBlock: chainBlocksConfig.endBlock,
          },
          latestIndexedBlock: chainStatusBlock,
          // During the backfill, the latestKnownBlock is the backfillEndBlock.
          latestKnownBlock: chainBackfillEndBlock,
          backfillEndBlock: chainBackfillEndBlock,
        } satisfies ChainIndexingBackfillStatus;
      }

      return deserializeENSIndexerIndexingStatus({
        chains: serializedChainIndexingStatuses,
      });
    });
};
