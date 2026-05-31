import { type CoinName, getCoderByCoinName } from "@ensdomains/address-encoder";
import { hexToBytes } from "@ensdomains/address-encoder/utils";
import { type BitcoinAddress, type SolanaAddress, toNormalizedAddress } from "enssdk";
import { isHex } from "viem";

import type { ProfileFieldParser } from "./types";

const buildAddressParser = <T extends string>(
  coinName: CoinName,
  format: (encoded: string) => T,
): ProfileFieldParser<T> => {
  const coder = getCoderByCoinName(coinName);

  return {
    selection: { addresses: [coder.coinType] },
    parse: (records) => {
      const raw = records.addresses?.[coder.coinType];
      if (raw == null || raw === "" || raw === "0x") return null;
      if (!isHex(raw)) return null;

      try {
        const bytes = hexToBytes(raw);
        if (bytes.length === 0 || bytes.every((byte) => byte === 0)) return null;

        return format(coder.encode(bytes));
      } catch {
        return null;
      }
    },
  };
};

export const ProfileAddressEthereumParser = buildAddressParser("eth", toNormalizedAddress);
export const ProfileAddressBaseParser = buildAddressParser("base", toNormalizedAddress);
export const ProfileAddressBitcoinParser = buildAddressParser(
  "btc",
  (address) => address as BitcoinAddress,
);
export const ProfileAddressSolanaParser = buildAddressParser(
  "sol",
  (address) => address as SolanaAddress,
);

/** All address parsers keyed by their GraphQL field name. */
export const ADDRESS_PARSERS = {
  ethereum: ProfileAddressEthereumParser,
  base: ProfileAddressBaseParser,
  bitcoin: ProfileAddressBitcoinParser,
  solana: ProfileAddressSolanaParser,
} as const satisfies Record<string, ProfileFieldParser<string>>;
