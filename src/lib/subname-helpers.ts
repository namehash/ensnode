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

/**
  TODO: this should be standardized via helper lib
  https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68

  This code is prohibiting indexed labels from including a null byte, a full stop (.), or square bracket characters ([]). Each of these characters are prohibited in normalized ENS names according to the ENSIP-15 standard https://docs.ens.domains/ensip/15 Therefore, any name containing a label with one or more of these characters is unusable by any app that has properly implemented ENS (which includes compliance with ENSIP-15, such as through the use of https://github.com/adraffy/ens-normalize.js or https://github.com/namehash/ens-normalize-python There are many other characters (beyond these 4) that are not supported by ENSIP-15 and that we are not building special checks for in this indexer. However, each of these 4 characters are considered to be "unindexable" due to specific indexing concerns:

  - null byte: postgres struggles with these strings (ideally we could write this more formally)
  - full stop: these can confuse ENS name processing code that assumes each full stop character is a label separator.
  - square brackets: some indexed labels are "unknown" (or "unindexable") but still require some representation within indexed data. For this purpose, a special "unknown label" format is defined that represents these labels in the format of "[{labelhash}]" where {labelhash} is the labelhash of the unknown label. When an indexed label is in this format it is necessary to distinguish an "unknown" label containing a labelhash, from an unnormalized label literal that is formatted to appear like an "unknown" label. For example, if the unnormalized label literal "[24695ee963d29f0f52edfdea1e830d2fcfc9052d5ba70b194bddd0afbbc89765]" is indexed, it will be considered "unindexable" (due to the square bracket characters) and therefore be represented as the following "unknown" label instead "[80968d00b78a91f47b233eaa213576293d16dadcbbdceb257bca94b08451ba7f]" which encodes the labelhash of the unnormalized label literal in square brackets.

  Names with these unnormalized / "unindexable" labels exist onchain because existing ENS contracts do not implement the ENSIP-15 standard. This standard is meaningfully complex and costly to implement onchain (high gas costs). Existing ENS contracts apply only very basic validation rules (ex: enforcing minimum character length, etc). Therefore, direct calls to these contracts skip any ENSIP-15 normalization check, resulting in names with these labels existing onchain.
 */
const UNINDEXABLE_LABEL_CHARACTER_CODES = new Set([0, 46, 91, 93]);
export const isLabelIndexable = (label: string) => {
  if (!label) return false;

  for (let i = 0; i < label.length; i++) {
    if (UNINDEXABLE_LABEL_CHARACTER_CODES.has(label.charCodeAt(i))) return false;
  }

  return true;
};

// TODO: this should be standardized via helper lib
// this is basically just ensjs#bytesToPacket w/ custom validity check
// https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L30
export function decodeDNSPacketBytes(buf: Uint8Array): [string | null, string | null] {
  if (buf.length === 0) return ["", "."];

  const name = bytesToPacket(buf);
  const labels = name.split(".");

  if (!labels.length) return [null, null];
  if (!labels.every(isLabelIndexable)) return [null, null];

  return [labels[0]!, name];
}
