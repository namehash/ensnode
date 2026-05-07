import type { NormalizedAddress } from "enssdk";
import { isNormalizedAddress } from "enssdk";

export const validateNormalizedAddress = (address: NormalizedAddress): void => {
  if (!isNormalizedAddress(address)) {
    throw new Error(`Invalid address: '${address}'. Address must be a lowercase EVM Address.`);
  }
};
