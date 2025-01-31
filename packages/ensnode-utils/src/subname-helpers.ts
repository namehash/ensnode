import { type Hex, concat, isHex, keccak256, namehash, toHex } from "viem";

// NOTE: most of these utils could/should be pulled in from some (future) ens helper lib, as they
// implement standard and reusable logic for typescript ens libs bu aren't necessarily implemented
// or exposed by ensjs or viem

export const ROOT_NODE = namehash("");

export const makeSubnodeNamehash = (node: Hex, label: Hex) => keccak256(concat([node, label]));

/**
 * Encodes a uint256 bigint as hex string sized to 32 bytes.
 * Uses include, in the context of ENS, decoding the uint256-encoded tokenId of NFT-issuing contracts
 * into Node or Labelhash, which is a common behavior in the ENS ecosystem.
 * (see NameWrapper, ETHRegistrarController)
 */
export const uint256ToHex32 = (num: bigint) => toHex(num, { size: 32 });

/**
 * These characters are prohibited in normalized ENS names per the ENSIP-15
 * standard (https://docs.ens.domains/ensip/15). Names containing labels with
 * one or more of these characters are unusable by any app implementing
 * ENSIP-15 (e.g., via https://github.com/adraffy/ens-normalize.js
 * or https://github.com/namehash/ens-normalize-python).
 *
 * While many other characters (beyond these 4) are not supported by
 * ENSIP-15, only the following 4 characters are classified as "unindexable" due
 * to specific indexing concerns.
 *
 * Onchain ENS contracts do not enforce ENSIP-15 normalization for reasons
 * including the gas costs of enforcement. This allows unnormalized labels
 * containing these characters to exist onchain. Such labels must be handled
 * carefully by indexers to avoid conflicts.
 *
 * Some indexed labels are "unknown" (or "unindexable") but still require a
 * representation within indexed data. For this purpose, a special "unknown
 * label" format is defined that represents these labels in the format of
 * "[{labelhash}]" where {labelhash} is the labelhash of the unknown label.
 * When an indexed label is in this format it is necessary to distinguish an
 * "unknown" label containing a labelhash, from an unnormalized label literal
 * that is formatted to appear like an "unknown" label. For example, if the
 * unnormalized label literal
 * "[24695ee963d29f0f52edfdea1e830d2fcfc9052d5ba70b194bddd0afbbc89765]"
 * is indexed, it will be considered "unindexable" (due to the square bracket
 * characters) and therefore be represented as the following "unknown" label instead
 * "[80968d00b78a91f47b233eaa213576293d16dadcbbdceb257bca94b08451ba7f]"
 * which encodes the labelhash of the unnormalized label literal in
 * square brackets.
 */
const UNINDEXABLE_LABEL_CHARACTERS = [
  "\0", // null byte: PostgreSQL does not allow storing this character in text fields.
  ".", // conflicts with ENS label separator logic.
  "[", // conflicts with "unknown label" representations.
  "]", // conflicts with "unknown label" representations.
];

const UNINDEXABLE_LABEL_CHARACTER_CODES = new Set(
  UNINDEXABLE_LABEL_CHARACTERS.map((char) => char.charCodeAt(0)),
);

const UNKNOWN_LABEL_PREFIX = "[" as const;
const UNKNOWN_LABEL_SUFFIX = "]" as const;

type UnknownLabel = `${typeof UNKNOWN_LABEL_PREFIX}${string}${typeof UNKNOWN_LABEL_SUFFIX}`;

export const unknownLabelAsHex = (label: UnknownLabel): Hex => `0x${label.slice(1, -1)}`;

export const isUnknownLabel = (label: string): label is UnknownLabel =>
  label.startsWith(UNKNOWN_LABEL_PREFIX) &&
  label.endsWith(UNKNOWN_LABEL_SUFFIX) &&
  label.length === 66 &&
  isHex(unknownLabelAsHex(label as UnknownLabel));

/**
 * Check if any characters in `label` are "unindexable".
 *
 * Related logic in ENS Subgraph:
 * https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L68
 */
export const isLabelIndexable = (label: string) => {
  if (!label) return false;

  if (isUnknownLabel(label)) return true;

  for (let i = 0; i < label.length; i++) {
    if (UNINDEXABLE_LABEL_CHARACTER_CODES.has(label.charCodeAt(i))) return false;
  }

  return true;
};

/**
 * NOTE: there seems to be a bug in ensjs#bytesToPacket regarding malformed names, which we were
 * originally using for this function.
 *
 * For example, in this tx `0x4ece50ae828f2a0f27f45d086e85a55e6284bff31a0a89daca9df4b1b1f5cb75` the
 * `name` input is `8436.eth` (it should have been just `8436`, as the `.eth` is inferred).
 *
 * This operates against a name that actually looks like `[fb1d24d5dc41613d5b4874e6cccb06ecf442f6f1773c3771c4fcce1161985a18].eth`
 * which results in a namehash of `0xfb1d24d5dc41613d5b4874e6cccb06ecf442f6f1773c3771c4fcce1161985a18`
 * and the NameWrapper emits an event with the packet bytes of `08383433362E6574680365746800`.
 * when ensjs#bytesToPacket sees these bytes, it returns a name of `8436.eth.eth`, which is incorrect.
 *
 * The original subgraph logic handled this case correctly, it seems, and so we re-implement it here.
 * https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L30
 *
 * More information about this discussion can be found in this thread:
 * https://github.com/namehash/ensnode/issues/36
 *
 * TODO: replace this function with ensjs#bytesToPacket when it correctly handles these cases. See
 * ensnode commit hash bace0ab55077d9f5cd37bd9d6638c4acb16334a8 for an example implementation.
 *
 */
export function decodeDNSPacketBytes(buf: Uint8Array): [string | null, string | null] {
  let offset = 0;
  let list: string[] = [];
  let len = buf[offset++];
  let hex = Buffer.from(buf).toString("hex");
  let firstLabel = "";

  if (len === 0) {
    return ["", "."];
  }

  while (len) {
    const label = hex.slice((offset + 1) * 2, (offset + 1 + len) * 2);
    const labelStr = Buffer.from(label, "hex").toString();

    if (!isLabelIndexable(labelStr)) {
      return [null, null];
    }

    if (offset > 1) {
      list.push(".");
    } else {
      firstLabel = labelStr;
    }
    list.push(labelStr);
    offset += len;
    len = buf[offset++];
  }
  return [firstLabel, list.join("")];
}
