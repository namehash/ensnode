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
