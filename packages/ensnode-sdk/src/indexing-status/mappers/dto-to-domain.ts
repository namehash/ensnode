import * as z from "zod/v4";
import { ENSNode } from "../../ensnode";
import { ChainId } from "../../utils/types";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";

/**
 * Positive Integer Schema
 */
const PositiveIntegerSchema = z.coerce
  .number({ error: `Value must be a positive integer.` })
  .int({ error: `Value must be a positive integer.` })
  .min(0, { error: `Value must be a positive integer.` });

/**
 * Partial Block Info Schema
 *
 * Related to {@link ENSNode.PartialBlockInfo}
 */
const PartialBlockInfoSchema = z.object({
  number: PositiveIntegerSchema,
});

/**
 * Block Info Schema
 *
 * Related to {@link IndexingStatusDTO.BlockInfo}.
 * Produces {@link IndexingStatusDomain.BlockInfo}.
 */
const FullBlockInfoSchema = PartialBlockInfoSchema.extend({
  createdAt: z.iso.datetime().transform((v) => new Date(v)),
});

/**
 * Chain ID Schema
 *
 * Related to {@link ChainId}.
 */
const ChainIdSchema = z.number().int().min(1);

/**
 * Indexing Phase Schema
 *
 * Related to {@link ENSNode.IndexingPhase}.
 */
const IndexingPhaseSchema = z.enum(ENSNode.IndexingPhase, {
  error: `Value must be a valid ENSNode IndexingPhase. Valid choices are: ${Object.values(
    ENSNode.IndexingPhase,
  ).join(", ")}`,
});

/**
 * RPC Health Schema
 *
 * Related to {@link ENSNode.RPCHealth}.
 */
const RpcHealthSchema = z.enum(ENSNode.RPCHealth, {
  error: `Value must be a valid ENSNode RPCHealth. Valid choices are: ${Object.values(
    ENSNode.RPCHealth,
  ).join(", ")}`,
});

/**
 * Chain Status Base Schema
 *
 * Related to {@link ENSNode.ChainStatusBase}
 */
const ChainStatusBaseSchema = z.object({
  chainId: ChainIdSchema,
  indexingPhase: IndexingPhaseSchema,
  rpcHealth: RpcHealthSchema,
});

// Define schemas for each specific combination of ChainStatus

/**
 * RPC Unhealthy & Sync Queued Schema
 *
 * Permutation ID: 1
 *
 * RPC is Unhealthy, so we can only assume the `firstBlockToIndex` is known just by its block number.
 */
const RpcUnhealthySyncQueuedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.SyncQueued),
  rpcHealth: z.literal(ENSNode.RPCHealth.Unhealthy),
  firstBlockToIndex: PartialBlockInfoSchema, // Only partial block info available
  lastSyncedBlock: z.null(),
  lastIndexedBlock: z.null(),
  latestSafeBlock: z.null(),
});

/**
 * RPC Healthy + Sync Queued
 *
 * Permutation ID: 2
 *
 * RPC is Healthy, so `firstBlockToIndex` and `latestSafeBlock` values must be known.
 */
const RpcHealthySyncQueuedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.SyncQueued),
  rpcHealth: z.literal(ENSNode.RPCHealth.Healthy),
  firstBlockToIndex: FullBlockInfoSchema, // Full block info available
  lastSyncedBlock: z.null(),
  lastIndexedBlock: z.null(),
  latestSafeBlock: FullBlockInfoSchema, // Full block info available
});

/**
 * RPC Unhealthy + Indexing Queued
 *
 * Permutation ID: 3
 *
 * RPC is Unhealthy, but indexing is queued, which means some blocks were synced.
 *
 * Both `firstBlockToIndex` and `lastSyncedBlock` values must be known.
 */
const RpcUnhealthyIndexingQueuedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.IndexingQueued),
  rpcHealth: z.literal(ENSNode.RPCHealth.Unhealthy),
  firstBlockToIndex: FullBlockInfoSchema, // Full block info available
  lastSyncedBlock: FullBlockInfoSchema, // Full block info available
  lastIndexedBlock: z.null(),
  latestSafeBlock: z.null(),
}).refine((v) => v.lastSyncedBlock.number >= v.firstBlockToIndex.number, {
  error: "`lastSyncedBlock.number` must be greater than or equal to `firstBlockToIndex.number`",
});

/**
 * RPC Healthy + Indexing Queued
 *
 * Permutation ID: 4
 *
 * RPC is Healthy, some blocks have been synced already. The following values must be known:
 * `firstBlockToIndex`, `lastSyncedBlock`, `latestSafeBlock`.
 */
const RpcHealthyIndexingQueuedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.IndexingQueued),
  rpcHealth: z.literal(ENSNode.RPCHealth.Healthy),
  firstBlockToIndex: FullBlockInfoSchema, // Full block info available
  lastSyncedBlock: FullBlockInfoSchema, // Full block info available
  lastIndexedBlock: z.null(),
  latestSafeBlock: FullBlockInfoSchema, // Full block info available
})
  .refine((v) => v.latestSafeBlock.number >= v.lastSyncedBlock.number, {
    error: "`latestSafeBlock.number` must be greater than or equal to `lastSyncedBlock.number`",
  })
  .refine((v) => v.lastSyncedBlock.number >= v.firstBlockToIndex.number, {
    error: "`lastSyncedBlock.number` must be greater than or equal to `firstBlockToIndex.number`",
  });

/**
 * RPC Unhealthy + Indexing Started
 *
 * Permutation ID: 5
 *
 * RPC is Unhealthy, some blocks have been indexed. The following values must be known:
 * `firstBlockToIndex`, `lastSyncedBlock`, `lastIndexedBlock`.
 */
const RpcUnhealthyIndexingStartedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.IndexingStarted),
  rpcHealth: z.literal(ENSNode.RPCHealth.Unhealthy),
  firstBlockToIndex: FullBlockInfoSchema, // Full block info available
  lastSyncedBlock: FullBlockInfoSchema, // Full block info available
  lastIndexedBlock: FullBlockInfoSchema, // Full block info available
  latestSafeBlock: z.null(),
})
  .refine((v) => v.lastSyncedBlock.number >= v.lastIndexedBlock.number, {
    error: "`lastSyncedBlock.number` must be greater than or equal to `lastIndexedBlock.number`",
  })
  .refine((v) => v.lastIndexedBlock.number >= v.firstBlockToIndex.number, {
    error: "`lastIndexedBlock.number` must be greater than or equal to `firstBlockToIndex.number`",
  });

/**
 * RPC Healthy + Indexing Started
 *
 * Permutation ID: 6
 *
 * RPC is Healthy, some blocks have been indexed. All block-related values must be known.
 */
const RpcHealthyIndexingStartedSchema = ChainStatusBaseSchema.extend({
  indexingPhase: z.literal(ENSNode.IndexingPhase.IndexingStarted),
  rpcHealth: z.literal(ENSNode.RPCHealth.Healthy),
  firstBlockToIndex: FullBlockInfoSchema, // Full block info available
  lastSyncedBlock: FullBlockInfoSchema, // Full block info available
  lastIndexedBlock: FullBlockInfoSchema, // Full block info available
  latestSafeBlock: FullBlockInfoSchema, // Full block info available
})
  .refine((v) => v.latestSafeBlock.number >= v.lastSyncedBlock.number, {
    error: "`latestSafeBlock.number` must be greater than or equal to `lastSyncedBlock.number`",
  })
  .refine((v) => v.lastSyncedBlock.number >= v.lastIndexedBlock.number, {
    error: "`lastSyncedBlock.number` must be greater than or equal to `lastIndexedBlock.number`",
  })
  .refine((v) => v.lastIndexedBlock.number >= v.firstBlockToIndex.number, {
    error: "`lastIndexedBlock.number` must be greater than or equal to `firstBlockToIndex.number`",
  });

/**
 * Chain Status Schema
 *
 * A union of all schemas which cover every possible chain status permutation.
 */
const ChainStatusSchema = z.union([
  RpcHealthySyncQueuedSchema,
  RpcUnhealthySyncQueuedSchema,
  RpcHealthyIndexingQueuedSchema,
  RpcUnhealthyIndexingQueuedSchema,
  RpcHealthyIndexingStartedSchema,
  RpcUnhealthyIndexingStartedSchema,
]);

/**
 * Indexing Status Schema
 *
 * Related to {@link IndexingStatusDTO.IndexingStatus}.
 * Produces {@link IndexingStatusDomain.IndexingStatus}.
 */
const IndexingStatusSchema = z
  .record(z.string().transform(Number).pipe(ChainIdSchema), ChainStatusSchema, {
    error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
  })
  .transform((parsedIndexStatusDto) => {
    const indexingStatusDomain: IndexingStatusDomain.IndexingStatus = new Map();

    for (const chainStatus of Object.values(parsedIndexStatusDto)) {
      indexingStatusDomain.set(chainStatus.chainId, chainStatus);
    }

    return indexingStatusDomain;
  });

/**
 * Map IndexingStatus DTO object into Indexing Status Domain object.
 *
 * @returns {IndexingStatusDomain.IndexingStatus}
 * @throws {Error} when the DTO object could not be mapped.
 */
export function mapIndexingStatusDtoIntoDomain(
  indexingStatusDto: IndexingStatusDTO.IndexingStatus,
): IndexingStatusDomain.IndexingStatus {
  const parsed = IndexingStatusSchema.safeParse(indexingStatusDto);

  if (parsed.error) {
    throw new Error(`Failed to map IndexingStatus DTO: \n${z.prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
