import type { Abi } from "viem";

/**
 * Event-only ABI for the EFP `ListRegistry` contract (the ERC-721 contract that
 * mints "list" NFTs).
 *
 * `UpdateListStorageLocation.listStorageLocation` is `bytes`: a packed
 * `version | locationType | chainId | contractAddress | slot` payload (decoded
 * by the EFP plugin). EFP defines a single `locationType` (1, EVM contract) —
 * see https://docs.efp.app/design/list-storage-location/.
 */
export const ListRegistry = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "UpdateListStorageLocation",
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "listStorageLocation", type: "bytes" },
    ],
  },
] as const satisfies Abi;
