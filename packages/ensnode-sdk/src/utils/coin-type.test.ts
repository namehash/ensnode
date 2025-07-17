import {
  coinTypeToEvmChainId as _coinTypeToEvmChainId,
  evmChainIdToCoinType as _evmChainIdToCoinType,
} from "@ensdomains/address-encoder/utils";

import { describe, expect, it } from "vitest";

import { bigintToCoinType, coinTypeToEvmChainId, evmChainIdToCoinType } from "./coin-type";
import { DEFAULT_EVM_CHAIN_ID, DEFAULT_EVM_COIN_TYPE, ETH_COIN_TYPE } from "./constants";

const INVALID_COIN_TYPE = 1337;
const VALID_COIN_TYPE = 2147483748; // XDAI
const VALID_CHAIN_ID = 1337;

describe("coinTypeToEvmChainId", () => {
  it("should return chainId 1 for ETH_COIN_TYPE", () => {
    expect(coinTypeToEvmChainId(ETH_COIN_TYPE)).toBe(1);
  });

  it("@ensdomains/address-encoder does not handle mainnet case", () => {
    expect(() => _coinTypeToEvmChainId(ETH_COIN_TYPE)).toThrow(/Coin type is not an EVM chain/i);
  });

  it("should throw for unknown CoinTypes", () => {
    expect(() => _coinTypeToEvmChainId(INVALID_COIN_TYPE)).toThrow(
      /Coin type is not an EVM chain/i,
    );
  });

  it("should match original for well-known coinTypes", () => {
    expect(coinTypeToEvmChainId(VALID_COIN_TYPE)).toBe(_coinTypeToEvmChainId(VALID_COIN_TYPE));
  });

  it("should return DEFAULT_CHAIN_ID (0) for DEFAULT_EVM_COIN_TYPE", () => {
    expect(coinTypeToEvmChainId(DEFAULT_EVM_COIN_TYPE)).toBe(DEFAULT_EVM_CHAIN_ID);
  });
});

describe("evmChainIdToCoinType", () => {
  it("should return ETH_COIN_TYPE for chainId 1", () => {
    expect(evmChainIdToCoinType(1)).toBe(ETH_COIN_TYPE);
  });

  it("@ensdomains/address-encoder does not handle mainnet case", () => {
    expect(() => _coinTypeToEvmChainId(ETH_COIN_TYPE)).toThrow(/Coin type is not an EVM chain/i);
  });

  it("should match original for non-mainnet chainIds", () => {
    expect(evmChainIdToCoinType(VALID_CHAIN_ID)).toBe(_evmChainIdToCoinType(VALID_CHAIN_ID));
  });

  it("should return DEFAULT_EVM_COIN_TYPE for DEFAULT_CHAIN_ID (0)", () => {
    expect(evmChainIdToCoinType(DEFAULT_EVM_CHAIN_ID)).toBe(DEFAULT_EVM_COIN_TYPE);
  });
});

describe("bigintToCoinType", () => {
  it("should convert a safe bigint to CoinType", () => {
    expect(bigintToCoinType(BigInt(ETH_COIN_TYPE))).toBe(ETH_COIN_TYPE);
  });

  it("should throw for too-large bigint", () => {
    expect(() => bigintToCoinType(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow();
  });
});
