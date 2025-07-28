import type { ENSNode } from "../../ensnode";
import { IndexingStatusDomain } from "../domain/types";
import { IndexingStatusDTO } from "../dto/types";

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

/**
 * Map block info (either partial or full).
 */
export function mapBlockInfo(
  blockInfoDomain: ENSNode.PartialBlockInfo,
): IndexingStatusDTO.BlockInfo;
export function mapBlockInfo(
  blockInfoDomain: IndexingStatusDomain.BlockInfo,
): IndexingStatusDTO.BlockInfo;
export function mapBlockInfo(
  blockInfoDomain: ENSNode.PartialBlockInfo | IndexingStatusDomain.BlockInfo,
): IndexingStatusDTO.BlockInfo | null {
  if (isBlockInfo(blockInfoDomain)) {
    return {
      number: blockInfoDomain.number,
      createdAt: blockInfoDomain.createdAt.toISOString(),
    } satisfies IndexingStatusDTO.BlockInfo;
  } else {
    // partial block info
    return {
      number: blockInfoDomain.number,
      createdAt: null,
    } satisfies IndexingStatusDTO.BlockInfo;
  }
}

export function mapChainStatus(
  chainStatusDomain: IndexingStatusDomain.ChainStatus,
): IndexingStatusDTO.ChainStatus {
  const chainStatusDto = {
    chainId: chainStatusDomain.chainId,
    indexingPhase: chainStatusDomain.indexingPhase,
    rpcHealth: chainStatusDomain.rpcHealth,
    firstBlockToIndex: mapBlockInfo(chainStatusDomain.firstBlockToIndex),
    lastSyncedBlock: chainStatusDomain.lastSyncedBlock
      ? mapBlockInfo(chainStatusDomain.lastSyncedBlock)
      : null,
    lastIndexedBlock: chainStatusDomain.lastIndexedBlock
      ? mapBlockInfo(chainStatusDomain.lastIndexedBlock)
      : null,
    latestSafeBlock: chainStatusDomain.latestSafeBlock
      ? mapBlockInfo(chainStatusDomain.latestSafeBlock)
      : null,
  } as IndexingStatusDTO.ChainStatus;

  return chainStatusDto;
}

export function mapIndexingStatusDomainIntoDto(
  indexingStatusDomain: IndexingStatusDomain.IndexingStatus,
): IndexingStatusDTO.IndexingStatus {
  const indexingStatusDto: IndexingStatusDTO.IndexingStatus = {};

  for (const [chainId, chainStatus] of indexingStatusDomain.entries()) {
    indexingStatusDto[`${chainId}`] = mapChainStatus(chainStatus);
  }

  return indexingStatusDto;
}
