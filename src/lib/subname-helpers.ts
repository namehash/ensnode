import { bytesToPacket } from "@ensdomains/ensjs/utils";
import { type Hex, concat, keccak256, namehash, toHex } from "viem";

// NOTE: most of these utils could/should be pulled in from some (future) ens helper lib, as they
// implement standard and reusable logic for typescript ens libs bu aren't necessarily implemented
// or exposed by ensjs or viem

export const ROOT_NODE = namehash("");
export const ETH_NODE = namehash("eth");

export const makeSubnodeNamehash = (node: Hex, label: Hex) => keccak256(concat([node, label]));

// converts uint256-encoded nodes to hex
export const tokenIdToLabel = (tokenId: bigint) => toHex(tokenId, { size: 32 });

// TODO: this should be standardized via helper lib
// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
const INVALID_CHARACTER_CODES_IN_LABEL = new Set([0, 46, 91, 93]);
export const isLabelValid = (name: string) => {
  if (!name) return false;

  for (let i = 0; i < name.length; i++) {
    if (INVALID_CHARACTER_CODES_IN_LABEL.has(name.charCodeAt(i))) return false;
  }

  return true;
};

// TODO: this should be standardized via helper lib
// https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L61C1-L65C2
const PARENT_CANNOT_CONTROL = 65536;
export const checkPccBurned = (fuses: number) =>
  (fuses & PARENT_CANNOT_CONTROL) == PARENT_CANNOT_CONTROL;

// TODO: this should be standardized via helper lib
// this is basically just ensjs#bytesToPacket w/ custom validity check
// https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L30
export function decodeDNSPacketBytes(buf: Uint8Array): [string | null, string | null] {
  if (buf.length === 0) return ["", "."];

  const name = bytesToPacket(buf);
  const labels = name.split(".");

  if (!labels.length) return [null, null];
  if (!labels.every(isLabelValid)) return [null, null];

  return [labels[0]!, name];
}
