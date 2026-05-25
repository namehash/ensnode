import type { Hex } from "viem";

/**
 * EFP `ListOp` opcodes (op version 0x01), encoded as `version | opcode | data`.
 *
 * @see https://docs.efp.app/design/list-ops/
 */
export const EFP_OPCODE = {
  ADD_RECORD: 0x01,
  REMOVE_RECORD: 0x02,
  ADD_TAG: 0x03,
  REMOVE_TAG: 0x04,
} as const;

/**
 * Well-known list-metadata keys emitted by the `ListRecords` contract. Both carry a 20-byte
 * address as their value and are reflected onto the `user` / `manager` columns of `efp_lists`.
 *
 * @see https://docs.efp.app/design/list-metadata/
 */
export const EFP_LIST_METADATA_KEYS = {
  USER: "user",
  MANAGER: "manager",
} as const;

/** The well-known ENS text-record key an ENS name sets to point at its EFP list. */
export const DEFAULT_EFP_LIST_TEXT_RECORD_KEY = "eth.efp.list";

/**
 * The canonical EFP `ListRegistry` (Base / 8453), used as the default target when an
 * `eth.efp.list` text record is a bare decimal token id (rather than a CAIP-19 asset id).
 *
 * Mirrors the `EFPBase` > `ListRegistry` entry in `packages/datasources/src/mainnet.ts`.
 */
export const DEFAULT_EFP_LIST_REGISTRY: { chainId: number; address: Hex } = {
  chainId: 8453,
  address: "0x0e688f5dca4a0a4729946acbc44c792341714e08",
};
