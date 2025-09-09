import type { Label } from "@ensnode/ensnode-sdk";

/**
 * The following 4 characters are classified as "unindexable" in emitted labels by the ENS Subgraph.
 *
 * For context on null bytes,
 * @see https://ens.mirror.xyz/9GN77d-MqGvRypm72FcwgxlUnPSuKWhG3rWxddHhRwM
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L76
 *
 * For context on the full stop (.) character,
 * @see https://docs.ens.domains/ensip/1/#name-syntax
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L80
 *
 * For context on Encoded LabelHashes,
 * @see https://ensnode.io/docs/reference/terminology#encoded-labelhash
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L87
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L91
 *
 * For additional context,
 * @see https://ensnode.io/docs/reference/terminology#subgraph-indexability--labelname-interpretation
 */
const UNINDEXABLE_LABEL_CHARACTERS = [
  "\0", // null byte: PostgreSQL does not allow storing this character in text fields.
  ".", // conflicts with ENS label separator logic
  "[", // conflicts with Encoded LabelHash format
  "]", // conflicts with Encoded LabelHash format
];

const UNINDEXABLE_LABEL_CHARACTER_CODES = new Set(
  UNINDEXABLE_LABEL_CHARACTERS.map((char) => char.charCodeAt(0)),
);

/**
 * Determine whether the provided `label` is "indexable" according to legacy Subgraph logic.
 *
 * A label is 'subgraph-unindexable' if it is unknown or contains one of the prohibited UTF-8 characters.
 *
 * Implements the following ENS Subgraph `checkValidLabel` function:
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L68
 *
 * @param label - The label to check. Note: A `null` value for `label` represents an unknown label.
 * @returns whether the provided Label is subgraph-indexable
 */
export const isLabelSubgraphIndexable = (label: Label | null): label is Label => {
  // an unknown label is not subgraph-indexable
  // https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L69
  if (label === null) return false;

  // the label string cannot include any of the documented character codes
  for (let i = 0; i < label.length; i++) {
    if (UNINDEXABLE_LABEL_CHARACTER_CODES.has(label.charCodeAt(i))) return false;
  }

  // otherwise, the label is subgraph-indexable
  return true;
};
