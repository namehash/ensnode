/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import { ChainName } from "@/indexing-status/ponder-metadata/types";
import {
  ChainIdString,
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingStatus,
  ChainIndexingUnstartedStatus,
  Duration,
  deserializeENSIndexerIndexingStatus,
} from "@ensnode/ensnode-sdk";
import { makeBlockRefSchema, makeChainIdSchema } from "@ensnode/ensnode-sdk/internal";
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

const PonderMetricSchema = z.object({
  isSyncComplete: PonderMetricBooleanSchema,
  isSyncRealtime: PonderMetricBooleanSchema,
  syncBlock: PonderBlockRefSchema,
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

  const invariant_definedEntryForEachIndexedChain = (v: Map<ChainName, unknown>) =>
    indexedChainNames.every((chainName) => Array.from(v.keys()).includes(chainName));

  return z
    .object({
      appSettings: PonderAppSettingsSchema,

      chains: z
        .map(
          ChainNameSchema,
          z.strictObject({
            blockRefs: PonderChainBlockRefsSchema,

            metrics: PonderMetricSchema,

            status: PonderChainStatus,
          }),
        )
        .refine(invariant_definedEntryForEachIndexedChain, {
          error: "All `indexedChainNames` must be represented by Ponder Chains Block Refs object.",
        }),
    })
    .transform((ponderIndexingStatus) => {
      const serializedChainIndexingStatuses = {} as Record<ChainIdString, ChainIndexingStatus>;

      for (const chainName of indexedChainNames) {
        const { blockRefs, metrics, status } = ponderIndexingStatus.chains.get(chainName)!;

        const { chainId, block: chainStatusBlock } = status;
        const { isSyncComplete, isSyncRealtime, syncBlock: chainSyncBlock } = metrics;
        const { config: chainBlocksConfig, backfillEndBlock: chainBackfillEndBlock } = blockRefs;

        // In omnichain ordering, if the startBlock is the same as the
        // status block, the chain has not started yet.
        if (chainBlocksConfig.startBlock.number === chainStatusBlock.number) {
          serializedChainIndexingStatuses[`${chainId}`] = {
            status: "unstarted",
            config: {
              startBlock: chainBlocksConfig.startBlock,
              endBlock: chainBlocksConfig.endBlock,
            },
          } satisfies ChainIndexingUnstartedStatus;

          // go to next iteration
          continue;
        }

        if (isSyncComplete) {
          serializedChainIndexingStatuses[`${chainId}`] = {
            status: "completed",
            config: {
              startBlock: chainBlocksConfig.startBlock,
              endBlock: chainBlocksConfig.endBlock!,
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
