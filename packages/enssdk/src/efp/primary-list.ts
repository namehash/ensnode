import { hexToBigInt, size } from "viem";

import type { Hex, TokenId } from "../lib/types";

/** The EFP AccountMetadata key whose value is an account's primary-list token id. */
export const EFP_PRIMARY_LIST_KEY = "primary-list";

/** A valid `primary-list` value is `abi.encodePacked(uint256 tokenId)`: exactly a 32-byte uint256. */
const PRIMARY_LIST_VALUE_SIZE = 32;

/**
 * Decode a `primary-list` account-metadata value (`abi.encodePacked(uint256 tokenId)`) into a token
 * id, or `null` if it isn't well-formed. EFP defines the value as exactly a 32-byte uint256, so
 * reject any other length rather than coerce a malformed value (e.g. `0x01`) into a real token id.
 *
 * Shared by the ENSIndexer EFP plugin (which decodes it into `efp_account_metadata.primaryListTokenId`
 * at index time, so follower/following validation is a SQL join) and ENSApi.
 */
export function decodePrimaryListTokenId(value: Hex): TokenId | null {
  if (size(value) !== PRIMARY_LIST_VALUE_SIZE) return null;
  return hexToBigInt(value) as TokenId;
}
