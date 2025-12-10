import { type Address, isAddressEqual, zeroAddress } from "viem";

/**
 * Interprets a viem#Address. zeroAddress is interpreted as null, otherwise Address.
 */
export const interpretAddress = (owner: Address) =>
  isAddressEqual(zeroAddress, owner) ? null : owner;
