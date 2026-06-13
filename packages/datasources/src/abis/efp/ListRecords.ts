import type { Abi } from "viem";

/**
 * Event-only ABI for the EFP `ListRecords` contract (deployed on Base, Optimism,
 * and Ethereum mainnet), which holds the records of each list.
 *
 * `slot` is emitted as `uint256` (matching the live contracts); the EFP plugin
 * zero-pads it to `bytes32` for storage. `ListOp.op` and `UpdateListMetadata.value`
 * are `bytes` packed payloads decoded by the plugin's parsers.
 */
export const ListRecords = [
  {
    type: "event",
    name: "ListOp",
    inputs: [
      { indexed: true, name: "slot", type: "uint256" },
      { indexed: false, name: "op", type: "bytes" },
    ],
  },
  {
    type: "event",
    name: "UpdateListMetadata",
    inputs: [
      { indexed: true, name: "slot", type: "uint256" },
      { indexed: false, name: "key", type: "string" },
      { indexed: false, name: "value", type: "bytes" },
    ],
  },
] as const satisfies Abi;
