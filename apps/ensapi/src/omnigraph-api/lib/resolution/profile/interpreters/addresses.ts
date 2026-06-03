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

import type { ProfileFieldInterpreter } from "./types";

const buildAddressInterpreter = <T extends string>(
  coinNameOrType: CoinName,
  format?: (encoded: string) => T,
): ProfileFieldInterpreter<T> => {
  const coder = getCoderByCoinName(coinNameOrType);
  const coinType = coder.coinType as CoinType;

  return {
    selection: { addresses: [coinType] },
    interpret: (result) => {
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

export const ProfileAddressEthereumInterpreter = buildAddressInterpreter(
  "eth",
  toNormalizedAddress,
);
export const ProfileAddressBaseInterpreter = buildAddressInterpreter("base", toNormalizedAddress);
export const ProfileAddressBitcoinInterpreter = buildAddressInterpreter<BitcoinAddress>("btc");
export const ProfileAddressSolanaInterpreter = buildAddressInterpreter<SolanaAddress>("sol");
export const ProfileAddressLitecoinInterpreter = buildAddressInterpreter<LitecoinAddress>("ltc");
export const ProfileAddressDogecoinInterpreter = buildAddressInterpreter<DogecoinAddress>("doge");
export const ProfileAddressMonacoinInterpreter = buildAddressInterpreter<MonacoinAddress>("mona");

export const ProfileAddressRootstockInterpreter = buildAddressInterpreter<RootstockAddress>("rbtc");
export const ProfileAddressRippleInterpreter = buildAddressInterpreter<RippleAddress>("xrp");
export const ProfileAddressBitcoinCashInterpreter =
  buildAddressInterpreter<BitcoinCashAddress>("bch");
export const ProfileAddressBinanceInterpreter = buildAddressInterpreter<BinanceAddress>("bnb");

export const ADDRESS_INTERPRETERS = {
  ethereum: ProfileAddressEthereumInterpreter,
  base: ProfileAddressBaseInterpreter,
  bitcoin: ProfileAddressBitcoinInterpreter,
  solana: ProfileAddressSolanaInterpreter,
  litecoin: ProfileAddressLitecoinInterpreter,
  dogecoin: ProfileAddressDogecoinInterpreter,
  monacoin: ProfileAddressMonacoinInterpreter,
  rootstock: ProfileAddressRootstockInterpreter,
  ripple: ProfileAddressRippleInterpreter,
  bitcoincash: ProfileAddressBitcoinCashInterpreter,
  binance: ProfileAddressBinanceInterpreter,
} as const satisfies Record<string, ProfileFieldInterpreter<string>>;
