import { type CoinName, coinNameToTypeMap, getCoderByCoinType } from "@ensdomains/address-encoder";
import {
  type BeautifiedLabel,
  type BeautifiedName,
  type BinanceAddress,
  type BitcoinAddress,
  type BitcoinCashAddress,
  type ChainId,
  type CoinType,
  type DogecoinAddress,
  type DomainId,
  type Email,
  type Hex,
  type InterfaceId,
  type InterpretedLabel,
  type InterpretedName,
  isInterfaceId,
  isInterpretedLabel,
  isInterpretedName,
  type JsonValue,
  type LitecoinAddress,
  type MonacoinAddress,
  type Name,
  type Node,
  type NormalizedAddress,
  type PermissionsId,
  type PermissionsResourceId,
  type PermissionsUserId,
  type RegistrationId,
  type RegistryId,
  type RenewalId,
  type ResolverId,
  type ResolverRecordsId,
  type RippleAddress,
  type RootstockAddress,
  type SolanaAddress,
} from "enssdk";
import { isHex, size } from "viem";
import { z } from "zod/v4";

import {
  makeChainIdSchema,
  makeCoinTypeSchema,
  makeEmailSchema,
  makeNormalizedAddressSchema,
} from "@ensnode/ensnode-sdk/internal";

import { builder } from "@/omnigraph-api/builder";

builder.scalarType("BigInt", {
  description: "BigInt represents non-fractional signed whole numeric values.",
  serialize: (value: bigint) => value.toString(),
  parseValue: (value) => z.coerce.bigint().parse(value),
});

builder.scalarType("JSON", {
  description: "JSON represents arbitrary JSON-serializable data.",
  serialize: (value: JsonValue) => value,
  parseValue: (value) => z.unknown().parse(value) as JsonValue,
});

builder.scalarType("Address", {
  description: "Address represents an EVM Address in all lowercase.",
  serialize: (value: NormalizedAddress) => value,
  parseValue: (value) => makeNormalizedAddressSchema("Address").parse(value),
});

builder.scalarType("Email", {
  description: "Email represents a validated contact email address.",
  serialize: (value: Email) => value,
  parseValue: (value) => makeEmailSchema("Email").parse(value),
});

const makeCoinAddressSchema = (coinName: CoinName, label: string) => {
  const coinType = coinNameToTypeMap[coinName];
  return z.coerce.string().check((ctx) => {
    try {
      getCoderByCoinType(coinType).decode(ctx.value);
    } catch {
      ctx.issues.push({
        code: "custom",
        message: `Must be a valid ${label} address`,
        input: ctx.value,
      });
    }
  });
};

builder.scalarType("BitcoinAddress", {
  description: `BitcoinAddress represents a Base58Check-encoded Bitcoin address (coin type ${coinNameToTypeMap.btc}).`,
  serialize: (value: BitcoinAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("btc", "Bitcoin").parse(value) as BitcoinAddress,
});

builder.scalarType("SolanaAddress", {
  description: `SolanaAddress represents a Base58-encoded Solana address (coin type ${coinNameToTypeMap.sol}).`,
  serialize: (value: SolanaAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("sol", "Solana").parse(value) as SolanaAddress,
});

builder.scalarType("LitecoinAddress", {
  description: `LitecoinAddress represents a Base58Check-encoded Litecoin address (coin type ${coinNameToTypeMap.ltc}).`,
  serialize: (value: LitecoinAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("ltc", "Litecoin").parse(value) as LitecoinAddress,
});

builder.scalarType("DogecoinAddress", {
  description: `DogecoinAddress represents a Base58Check-encoded Dogecoin address (coin type ${coinNameToTypeMap.doge}).`,
  serialize: (value: DogecoinAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("doge", "Dogecoin").parse(value) as DogecoinAddress,
});

builder.scalarType("MonacoinAddress", {
  description: `MonacoinAddress represents a Base58Check-encoded Monacoin address (coin type ${coinNameToTypeMap.mona}).`,
  serialize: (value: MonacoinAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("mona", "Monacoin").parse(value) as MonacoinAddress,
});

builder.scalarType("RootstockAddress", {
  description: `RootstockAddress represents an EIP-55 checksummed Rootstock (RBTC) address (coin type ${coinNameToTypeMap.rbtc}).`,
  serialize: (value: RootstockAddress) => value,
  parseValue: (value) =>
    makeCoinAddressSchema("rbtc", "Rootstock").parse(value) as RootstockAddress,
});

builder.scalarType("RippleAddress", {
  description: `RippleAddress represents a Base58Check-encoded Ripple (XRP) address (coin type ${coinNameToTypeMap.xrp}).`,
  serialize: (value: RippleAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("xrp", "Ripple").parse(value) as RippleAddress,
});

builder.scalarType("BitcoinCashAddress", {
  description: `BitcoinCashAddress represents a CashAddr-encoded Bitcoin Cash address (coin type ${coinNameToTypeMap.bch}).`,
  serialize: (value: BitcoinCashAddress) => value,
  parseValue: (value) =>
    makeCoinAddressSchema("bch", "Bitcoin Cash").parse(value) as BitcoinCashAddress,
});

builder.scalarType("BinanceAddress", {
  description: `BinanceAddress represents a Bech32-encoded Binance Chain (BNB) address (coin type ${coinNameToTypeMap.bnb}).`,
  serialize: (value: BinanceAddress) => value,
  parseValue: (value) => makeCoinAddressSchema("bnb", "Binance").parse(value) as BinanceAddress,
});

builder.scalarType("Hex", {
  description: "Hex represents viem#Hex.",
  serialize: (value: Hex) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isHex(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message: "Must be a valid Hex",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as Hex)
      .parse(value),
});

builder.scalarType("ChainId", {
  description: "ChainId represents an enssdk#ChainId.",
  serialize: (value: ChainId) => value,
  parseValue: (value) => makeChainIdSchema("ChainId").parse(value),
});

builder.scalarType("CoinType", {
  description: "CoinType represents an enssdk#CoinType.",
  serialize: (value: CoinType) => value,
  parseValue: (value) => makeCoinTypeSchema("CoinType").parse(value),
});

builder.scalarType("InterfaceId", {
  description: "InterfaceId represents an ERC-165 interface id (4-byte hex selector).",
  serialize: (value: InterfaceId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val.toLowerCase())
      .check((ctx) => {
        if (!isInterfaceId(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message: "Must be a 4-byte hex (0x + 8 hex chars)",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as InterfaceId)
      .parse(value),
});

builder.scalarType("Node", {
  description: "Node represents an enssdk#Node.",
  serialize: (value: Node) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (isHex(ctx.value) && size(ctx.value) === 32) return;

        ctx.issues.push({
          code: "custom",
          message: `Node must be a valid Node`,
          input: ctx.value,
        });
      })
      .transform((val) => val as Node)
      .parse(value),
});

builder.scalarType("InterpretedName", {
  description: "InterpretedName represents an enssdk#InterpretedName.",
  serialize: (value: Name) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isInterpretedName(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message:
              "InterpretedName must consist exclusively of Encoded LabelHashes or normalized labels.",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as InterpretedName)
      .parse(value),
});

builder.scalarType("InterpretedLabel", {
  description: "InterpretedLabel represents an enssdk#InterpretedLabel.",
  serialize: (value: Name) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isInterpretedLabel(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message: "InterpretedLabel must be an Encoded LabelHash or normalized.",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as InterpretedLabel)
      .parse(value),
});

builder.scalarType("BeautifiedName", {
  description:
    "BeautifiedName represents an enssdk#BeautifiedName: an InterpretedName whose normalized labels have been beautified per ENSIP-15 (https://docs.ens.domains/ensip/15) for display. It is display-only and MUST NOT be used as a navigation target or lookup key.",
  serialize: (value: BeautifiedName) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as BeautifiedName)
      .parse(value),
});

builder.scalarType("BeautifiedLabel", {
  description:
    "BeautifiedLabel represents an enssdk#BeautifiedLabel: an InterpretedLabel beautified per ENSIP-15 (https://docs.ens.domains/ensip/15) for display. It is display-only and MUST NOT be used as a lookup key.",
  serialize: (value: BeautifiedLabel) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as BeautifiedLabel)
      .parse(value),
});

builder.scalarType("DomainId", {
  description: "DomainId represents an enssdk#DomainId.",
  serialize: (value: DomainId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as DomainId)
      .parse(value),
});

builder.scalarType("RegistryId", {
  description: "RegistryId represents an enssdk#RegistryId.",
  serialize: (value: RegistryId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistryId)
      .parse(value),
});

builder.scalarType("ResolverId", {
  description: "ResolverId represents an enssdk#ResolverId.",
  serialize: (value: ResolverId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverId)
      .parse(value),
});

builder.scalarType("PermissionsId", {
  description: "PermissionsId represents an enssdk#PermissionsId.",
  serialize: (value: PermissionsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsId)
      .parse(value),
});

builder.scalarType("PermissionsResourceId", {
  description: "PermissionsResourceId represents an enssdk#PermissionsResourceId.",
  serialize: (value: PermissionsResourceId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsResourceId)
      .parse(value),
});

builder.scalarType("PermissionsUserId", {
  description: "PermissionsUserId represents an enssdk#PermissionsUserId.",
  serialize: (value: PermissionsUserId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsUserId)
      .parse(value),
});

builder.scalarType("RegistrationId", {
  description: "RegistrationId represents an enssdk#RegistrationId.",
  serialize: (value: RegistrationId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistrationId)
      .parse(value),
});

builder.scalarType("RenewalId", {
  description: "RenewalId represents an enssdk#RenewalId.",
  serialize: (value: RenewalId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RenewalId)
      .parse(value),
});

builder.scalarType("ResolverRecordsId", {
  description: "ResolverRecordsId represents an enssdk#ResolverRecordsId.",
  serialize: (value: ResolverRecordsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverRecordsId)
      .parse(value),
});
