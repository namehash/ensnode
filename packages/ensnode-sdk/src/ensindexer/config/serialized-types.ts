import type { ChainId } from "../../shared/types";
import type { EnsIndexerPublicConfig, EnsIndexerVersionInfo } from "./types";

export type SerializedIndexedChainIds = Array<ChainId>;

/**
 * Serialized representation of {@link EnsIndexerPublicConfig}
 */
export interface SerializedEnsIndexerPublicConfig
  extends Omit<EnsIndexerPublicConfig, "indexedChainIds"> {
  /**
   * Array representation of {@link EnsIndexerPublicConfig.indexedChainIds}.
   */
  indexedChainIds: ChainId[];
}

/**
 * Serialized representation of {@link EnsIndexerPublicConfig}
 *
 * @deprecated Use {@link SerializedEnsIndexerPublicConfig} instead.
 */
export type SerializedENSIndexerPublicConfig = SerializedEnsIndexerPublicConfig;

/**
 * Serialized representation of {@link EnsIndexerVersionInfo}
 */
export type SerializedEnsIndexerVersionInfo = EnsIndexerVersionInfo;

/**
 * Serialized representation of {@link EnsIndexerVersionInfo}
 *
 * @deprecated Use {@link SerializedEnsIndexerVersionInfo} instead.
 */
export type SerializedENSIndexerVersionInfo = SerializedEnsIndexerVersionInfo;
