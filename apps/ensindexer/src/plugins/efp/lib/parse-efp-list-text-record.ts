/**
 * Parser for the well-known ENS text-record `eth.efp.list`, which an ENS name's owner sets on their
 * resolver to declare which EFP list NFT belongs to that name.
 *
 * Two value formats are accepted:
 *   1. Decimal token id        — `"1234"` — interpreted as a list on the default EFP ListRegistry
 *                                (Base / 8453).
 *   2. CAIP-19 asset identifier — `"eip155:8453/erc721:0x0E68…4e08/1234"` — explicit chain id,
 *                                contract address, and token id.
 *
 * Returns `null` on any shape mismatch — the caller then deletes the pointer (matching the ENS
 * convention that "set to garbage" is equivalent to "unset").
 */

import { type Hex, isAddress } from "viem";

import { DEFAULT_EFP_LIST_REGISTRY } from "../constants";

export interface ParsedEfpListPointer {
  listTokenId: string;
  /** EFP `ListRegistry` chain id. Defaults to 8453 (Base) for plain decimal values. */
  listChainId: number;
  /** EFP `ListRegistry` contract address, always lowercased. */
  listContract: Hex;
}

const DECIMAL_RE = /^[0-9]+$/;
const CAIP19_RE =
  /^eip155:(?<chainId>[0-9]+)\/erc721:(?<address>0x[0-9a-fA-F]{40})\/(?<tokenId>[0-9]+)$/;

export function parseEfpListTextRecord(value: string): ParsedEfpListPointer | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (DECIMAL_RE.test(trimmed)) {
    return {
      listTokenId: trimmed,
      listChainId: DEFAULT_EFP_LIST_REGISTRY.chainId,
      listContract: DEFAULT_EFP_LIST_REGISTRY.address.toLowerCase() as Hex,
    };
  }

  const m = CAIP19_RE.exec(trimmed);
  if (!m?.groups) return null;
  const { chainId, address, tokenId } = m.groups;
  if (!chainId || !address || !tokenId) return null;
  // Tolerate mixed-case addresses (no EIP-55 checksum enforcement): an ENS text record is often
  // hand-edited. The regex already restricts it to 40 hex chars.
  if (!isAddress(address, { strict: false })) return null;
  return {
    listTokenId: tokenId,
    listChainId: Number(chainId),
    listContract: address.toLowerCase() as Hex,
  };
}
