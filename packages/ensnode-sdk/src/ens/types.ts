import type { Hex } from "viem";

// re-export ENSNamespaceIds and ENSNamespaceId from @ensnode/datasources
// so consumers don't need it as a dependency
export { ENSNamespaceIds } from "@ensnode/datasources";
export type { ENSNamespaceId } from "@ensnode/datasources";

/**
 * A hash value that uniquely identifies a single ENS name.
 * Result of `namehash` function as specified in ENSIP-1.
 *
 * @example
 * ```
 * namehash("vitalik.eth") === "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"
 * ```
 * @see https://docs.ens.domains/ensip/1#namehash-algorithm
 * @see https://ensnode.io/docs/reference/terminology#name-node-namehash
 */
export type Node = Hex;

/**
 * A Name represents a human-readable ENS name.
 *
 * @example vitalik.eth
 * @see https://ensnode.io/docs/reference/terminology#name-node-namehash
 */
export type Name = string;

/**
 * A Normalized Name represents a normalized ENS name.
 *
 * @example vitalik.eth
 * @see https://ensnode.io/docs/reference/terminology#name-node-namehash
 */
export type NormalizedName = Name & { __brand: "NormalizedName" };

/**
 * A LabelHash is the result of the labelhash function (which is just keccak256) on a Label.
 *
 * @example
 * ```
 * labelhash('vitalik') === '0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc'
 * ```
 *
 * @see https://docs.ens.domains/terminology#labelhash
 * @see https://ensnode.io/docs/reference/terminology#labels-labelhashes-labelhash-function
 */
export type LabelHash = Hex;

/**
 * A Label is a single part of an ENS Name.
 *
 * @example vitalik
 *
 * @see https://docs.ens.domains/terminology#label
 * @see https://ensnode.io/docs/reference/terminology#labels-labelhashes-labelhash-function
 */
export type Label = string;

/**
 * An EncodedLabelHash is a specially formatted (unnormalized) Label formatted
 * as a non-0x prefixed 32-byte hex string enclosed in square brackets.
 *
 * Care should be taken to distinguish Label values formatted as an
 * EncodedLabelHash as either a LiteralLabel or an InterpretedLabel:
 * - If a LiteralLabel is formatted as an EncodedLabelHash it does NOT
 *   symbolically represent the encoding of a LabelHash literal.
 * - If an InterpretedLabel is formatted as an EncodedLabelHash it should be
 *   interpreted as encoding a LabelHash literal.
 *
 * An InterpretedLabel may be formatted as an EncodedLabelHash if the related
 * LiteralLabel is:
 * - not a normalized label
 * - is an unknown value that could not be healed.
 * - is too long for DNS-Encoding in contexts where DNS-Encoding was required.
 *
 * @example [af2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc]
 *
 * @see https://ensnode.io/docs/reference/terminology#encoded-labelhash
 */
export type EncodedLabelHash = `[${string}]`;

/**
 * A Literal Label is a Label as it literally appears onchain, without any interpretation
 * or normalization processing. It may be an unnormalized label for reasons including:
 * - being an empty label,
 * - containing '.' characters,
 * - being formatted as an EncodedLabelHash (which are not normalizable). Note that
 *   when LiteralLabel are formatted as an EncodedLabelHash they do NOT symbolically
 *   represent the encoding of a LabelHash literal, or
 * - containing other unnormalized characters such as null bytes or other characters
 *   not suitable for display.
 *
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type LiteralLabel = Label & { __brand: "LiteralLabel" };

/**
 * An Interpreted Label is a Label that is either:
 * a) a Normalized Label, or
 * b) an Unnormalizable Label exclusively for the reason that it is formatted
 *    as an Encoded LabelHash that should be interpreted as encoding a
 *    LabelHash literal, where the encoded LabelHash literal is the `labelhash`
 *    of the related LiteralLabel.
 *
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type InterpretedLabel = Label & { __brand: "InterpretedLabel" };

/**
 * A Literal Name is a Name as it literally appears onchain, composed of Literal Labels
 * joined by dots. It may be an unnormalized name for reasons including:
 * - containing empty labels,
 * - containing LiteralLabel values formatted as an EncodedLabelHash (which are
 *   not normalizable)). Note that when LiteralLabel values are formatted as an
 *   EncodedLabelHash they do NOT symbolically represent the encoding of a
 *   LabelHash literal, or
 * - containing other unnormalized characters such as null bytes or other characters
 *   not suitable for display.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-name
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type LiteralName = Name & { __brand: "LiteralName" };

/**
 * An Interpreted Name is a Name that is entirely composed of 0 or more
 * Interpreted Labels.
 *
 * That is, it is either:
 * a) a Normalized Name, or
 * b) an Unnormalizable Name exclusively for the reason that it contains 1 or
 *    more labels formatted as Encoded LabelHashes that should be interpreted
 *    as encoding a LabelHash literal, where the encoded LabelHash literal is
 *    the `labelhash` of the related LiteralLabel.
 *
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type InterpretedName = Name & { __brand: "InterpretedName" };

/**
 * A DNS-Encoded Name as a hex string, representing the binary DNS wire format encoding
 * of a domain name. Used in ENS contracts for efficient name storage and transmission.
 * Each label is prefixed with a length byte, and the entire sequence is null-terminated.
 *
 * @example "0x07766974616c696b03657468000" represents "vitalik.eth"
 *
 * @see https://docs.ens.domains/resolution/names/#dns-encoding
 * @see https://github.com/ensdomains/ens-contracts/blob/staging/contracts/utils/NameCoder.sol
 *
 * DNS Packet Format for Domain Names:
 * - Domain names are encoded as a sequence of labels
 * - Each label begins with a length byte (1 byte) indicating how many bytes follow for that label
 * - The bytes after the length byte represent the characters in the label
 * - Labels are concatenated with no separators
 * - The sequence ends with a zero-length byte (0x00)
 *
 * Example: "example.eth" is encoded as:
 * [0x07, 'e', 'x', 'a', 'm', 'p', 'l', 'e', 0x03, 'e', 't', 'h', 0x00]
 * Where 0x07 is the length of "example", 0x03 is the length of "eth", and 0x00 marks the end
 *
 * @dev This type is _structurally_ typed to aid Event Argument Typing — consumers should further
 * cast the type of the event argument to a _nominally_ typed DNSEncodedName like {@link DNSEncodedLiteralName}
 * or {@link DNSEncodedPartiallyInterpretedName} depending on the context.
 */
export type DNSEncodedName = Hex;

/**
 * A DNSEncodedName that encodes a name containing {@link LiteralLabel}s.
 *
 * In a DNSEncodedLiteralName, all labels are understood to be Literal Labels, including labels
 * that may look like Encoded LabelHashes: when interpreted, the Interpeted Label will be the
 * `labelhash` of the "[abcd...xyz]" string.
 *
 * The NameWrapper contract emits DNSEncodedLiteralNames:
 * @see https://github.com/ensdomains/ens-contracts/blob/staging/contracts/utils/BytesUtils_LEGACY.sol
 *
 * The ThreeDNSToken contract emits DNSEncodedLiteralNames:
 * @see https://github.com/3dns-xyz/contracts/blob/44937318ae26cc036982e8c6a496cd82ebdc2b12/src/regcontrol/libraries/BytesUtils.sol
 *
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type DNSEncodedLiteralName = DNSEncodedName & { __brand: "DNSEncodedLiteralName" };

/**
 * A DNSEncodedName that represents a name consisting of labels that are either:
 * a) Literal Labels, or
 * b) Encoded LabelHashes.
 *
 * In a DNSEncodedPartiallyInterpretedName, strings that look like Encoded LabelHashes are understood
 * to be Encoded LabelHashes: when interpreted, the Interpeted Label will be the exact value of the
 * decoded "[abcd...xyz]" string.
 *
 * TODO: This type is unused in ENSv1, but its usage is anticipated in ENSv2 due to Encoded
 * LabelHash support in the NameCoder contract.
 *
 * TODO: determine "is this label an encoded labelhash" logic after NameCoder is updated
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/staging/contracts/utils/NameCoder.sol
 *
 * @dev nominally typed to enforce usage & enhance codebase clarity
 */
export type DNSEncodedPartiallyInterpretedName = DNSEncodedName & {
  __brand: "DNSEncodedPartiallyInterpretedName";
};
