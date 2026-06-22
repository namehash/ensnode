import type { Abi } from "viem";

/**
 * Event-only ABI for the EFP `AccountMetadata` contract, which stores arbitrary
 * `(addr, key) -> value` metadata for accounts (today only `primary-list`).
 *
 * `value` is `bytes` (not `string`): the contract emits raw bytes, and most
 * keys store binary payloads.
 */
export const AccountMetadata = [
  {
    type: "event",
    name: "UpdateAccountMetadata",
    inputs: [
      { indexed: true, name: "addr", type: "address" },
      { indexed: false, name: "key", type: "string" },
      { indexed: false, name: "value", type: "bytes" },
    ],
  },
] as const satisfies Abi;
