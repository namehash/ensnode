import { type Address, isAddress } from "viem";

export const validateLowercaseAddress = (address: Address): void => {
  if (!isAddress(address, { strict: false })) {
    throw new Error(`Invalid address: ${address}. Address must be a valid EVM address.`);
  }

  if (address !== address.toLowerCase()) {
    throw new Error(`Invalid address: ${address}. Address must be in lowercase format.`);
  }
};

export const normalizeAddress = (address: Address): Address => {
  return address.toLowerCase() as Address;
};
