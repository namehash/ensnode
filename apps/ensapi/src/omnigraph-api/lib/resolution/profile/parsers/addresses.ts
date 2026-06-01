import { type CoinName, getCoderByCoinName, getCoderByCoinType } from "@ensdomains/address-encoder";
import { hexToBytes } from "@ensdomains/address-encoder/utils";
import {
  type BinanceAddress,
  type BitcoinAddress,
  type BitcoinCashAddress,
  type CoinType,
  type DogecoinAddress,
  type LitecoinAddress,
  type MonacoinAddress,
  type RippleAddress,
  type RootstockAddress,
  type SolanaAddress,
  toNormalizedAddress,
} from "enssdk";
import { isHex } from "viem";

import type { ProfileFieldParser } from "./types";

const buildAddressParser = <T extends string>(
  coinNameOrType: CoinName | number,
  format: (encoded: string) => T,
): ProfileFieldParser<T> => {
  const coder =
    typeof coinNameOrType === "number"
      ? getCoderByCoinType(coinNameOrType)
      : getCoderByCoinName(coinNameOrType);
  const coinType = coder.coinType as CoinType;

  return {
    selection: { addresses: [coinType] },
    parse: (records) => {
      const raw = records.addresses?.[coinType];
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
export const ProfileAddressLitecoinParser = buildAddressParser(
  "ltc",
  (address) => address as LitecoinAddress,
);
export const ProfileAddressDogecoinParser = buildAddressParser(
  "doge",
  (address) => address as DogecoinAddress,
);
export const ProfileAddressMonacoinParser = buildAddressParser(
  "mona",
  (address) => address as MonacoinAddress,
);
/** Rootstock (RBTC) — coinType 137, EIP-55 checksummed EVM address. */
export const ProfileAddressRootstockParser = buildAddressParser(
  137,
  (address) => address as RootstockAddress,
);
export const ProfileAddressRippleParser = buildAddressParser(
  "xrp",
  (address) => address as RippleAddress,
);
export const ProfileAddressBitcoinCashParser = buildAddressParser(
  "bch",
  (address) => address as BitcoinCashAddress,
);
export const ProfileAddressBinanceParser = buildAddressParser(
  "bnb",
  (address) => address as BinanceAddress,
);

/** All address parsers keyed by their GraphQL field name. */
export const ADDRESS_PARSERS = {
  ethereum: ProfileAddressEthereumParser,
  base: ProfileAddressBaseParser,
  bitcoin: ProfileAddressBitcoinParser,
  solana: ProfileAddressSolanaParser,
  litecoin: ProfileAddressLitecoinParser,
  dogecoin: ProfileAddressDogecoinParser,
  monacoin: ProfileAddressMonacoinParser,
  rootstock: ProfileAddressRootstockParser,
  ripple: ProfileAddressRippleParser,
  bitcoincash: ProfileAddressBitcoinCashParser,
  binance: ProfileAddressBinanceParser,
} as const satisfies Record<string, ProfileFieldParser<string>>;
