import type { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";

export function serializeIndexingStatus(
  indexingStatusDomain: IndexingStatusDomain.IndexingStatus,
): IndexingStatusDTO.IndexingStatus {
  const indexingStatusDto: IndexingStatusDTO.IndexingStatus = {};

  for (const [chainId, chainStatus] of indexingStatusDomain.entries()) {
    indexingStatusDto[`${chainId}`] = serializeChainStatus(chainStatus);
  }

  return indexingStatusDto;
}

export function serializeChainStatus(
  chainStatusDomain: IndexingStatusDomain.ChainStatus,
): IndexingStatusDTO.ChainStatus {
  const chainStatusDto = {
    chainId: chainStatusDomain.chainId,
    indexingPhase: chainStatusDomain.indexingPhase,
    rpcHealth: chainStatusDomain.rpcHealth,
    firstBlockToIndex: serializeBlockInfo(chainStatusDomain.firstBlockToIndex),
    lastSyncedBlock: chainStatusDomain.lastSyncedBlock
      ? serializeBlockInfo(chainStatusDomain.lastSyncedBlock)
      : null,
    lastIndexedBlock: chainStatusDomain.lastIndexedBlock
      ? serializeBlockInfo(chainStatusDomain.lastIndexedBlock)
      : null,
    latestSafeBlock: chainStatusDomain.latestSafeBlock
      ? serializeBlockInfo(chainStatusDomain.latestSafeBlock)
      : null,
  } as IndexingStatusDTO.ChainStatus;

  return chainStatusDto;
}

export function serializeBlockInfo(
  blockInfoDomain: ENSNode.PartialBlockInfo,
): IndexingStatusDTO.BlockInfo;
export function serializeBlockInfo(
  blockInfoDomain: IndexingStatusDomain.BlockInfo,
): IndexingStatusDTO.BlockInfo;

export function serializeBlockInfo(
  blockInfoDomain: ENSNode.PartialBlockInfo | IndexingStatusDomain.BlockInfo,
): IndexingStatusDTO.BlockInfo | null {
  if (isBlockInfo(blockInfoDomain)) {
    return {
      number: blockInfoDomain.number,
      createdAt: blockInfoDomain.createdAt.toISOString(),
    } satisfies IndexingStatusDTO.BlockInfo;
  }

  // handle the PartialBlockInfo
  return {
    number: blockInfoDomain.number,
    createdAt: null,
  } satisfies IndexingStatusDTO.BlockInfo;
}

/**
 * Predicate describing {@link IndexingStatusDomain.BlockInfo} object.
 */
function isBlockInfo(
  blockInfo: ENSNode.PartialBlockInfo | IndexingStatusDomain.BlockInfo,
): blockInfo is IndexingStatusDomain.BlockInfo {
  const blockKeys = Object.keys(blockInfo);
  // A BlockInfo object has more than one property attached.
  return blockKeys.length > 1;
}
