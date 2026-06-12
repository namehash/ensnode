/**
 * EFP versions its payload schemas independently with a leading `version` byte. Each is `1` today,
 * and a decoder rejects any other value rather than decode a future or unknown schema as v1. They
 * are separate constants because a bump to one schema (say `ListOp`) does not imply a bump to the
 * others (`ListRecord`, List Storage Location).
 *
 * @see https://docs.efp.app/design/list-ops/
 */
export const EFP_LIST_OP_VERSION = 1;
export const EFP_RECORD_VERSION = 1;
export const EFP_LSL_VERSION = 1;

/** The only EFP `ListRecord` type EFP defines: a 20-byte address. Types 0 and 2-255 are reserved. */
export const EFP_RECORD_TYPE_ADDRESS = 0x01;

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
