import { type CoinName, getCoderByCoinName } from "@ensdomains/address-encoder";
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
import { isHex, toBytes } from "viem";

import type { ProfileFieldParser } from "./types";

const buildAddressParser = <T extends string>(
  coinNameOrType: CoinName,
  format?: (encoded: string) => T,
): ProfileFieldParser<T> => {
  const coder = getCoderByCoinName(coinNameOrType);
  const coinType = coder.coinType as CoinType;

  return {
    selection: { addresses: [coinType] },
    parse: (result) => {
      const raw = result.records.addresses?.[coinType];
      if (raw == null || raw === "0x") return null;
      if (!isHex(raw)) return null;

      try {
        const bytes = toBytes(raw);
        if (bytes.length === 0 || bytes.every((byte) => byte === 0)) return null;

        const encoded = coder.encode(bytes);

        if (format) {
          return format(encoded);
        }

        return encoded as T;
      } catch {
        return null;
      }
    },
  };
};

export const ProfileAddressEthereumParser = buildAddressParser("eth", toNormalizedAddress);
export const ProfileAddressBaseParser = buildAddressParser("base", toNormalizedAddress);
export const ProfileAddressBitcoinParser = buildAddressParser<BitcoinAddress>("btc");
export const ProfileAddressSolanaParser = buildAddressParser<SolanaAddress>("sol");
export const ProfileAddressLitecoinParser = buildAddressParser<LitecoinAddress>("ltc");
export const ProfileAddressDogecoinParser = buildAddressParser<DogecoinAddress>("doge");
export const ProfileAddressMonacoinParser = buildAddressParser<MonacoinAddress>("mona");

export const ProfileAddressRootstockParser = buildAddressParser<RootstockAddress>("rbtc");
export const ProfileAddressRippleParser = buildAddressParser<RippleAddress>("xrp");
export const ProfileAddressBitcoinCashParser = buildAddressParser<BitcoinCashAddress>("bch");
export const ProfileAddressBinanceParser = buildAddressParser<BinanceAddress>("bnb");

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
