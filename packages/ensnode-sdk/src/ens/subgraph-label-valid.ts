import { Label } from "./types";

/**
 * The following 4 characters are classified as "invalid" in emitted labels by the ENS Subgraph due
 * to indexing concerns.
 *
 * For null byte context,
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
 * @see https://ensnode.io/docs/usage/querying-best-practices/#ens-subgraph-valid-and-invalid-labels
 */
const INVALID_LABEL_CHARACTERS = [
  "\0", // null byte: PostgreSQL does not allow storing this character in text fields.
  ".", // conflicts with ENS label separator logic
  "[", // conflicts with Encoded LabelHash format
  "]", // conflicts with Encoded LabelHash format
];

const INVALID_LABEL_CHARACTER_CODES = new Set(
  INVALID_LABEL_CHARACTERS.map((char) => char.charCodeAt(0)),
);

/**
 * Check if any characters in `label` are "valid" according to legacy Subgraph logic.
 *
 * Implements the following ENS Subgraph `checkValidLabel` function:
 * @see https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L68
 *
 * @param label - The label to check. Note: A `null` value for `label` represents an unknown label.
 * @returns whether the provided Label is subgraph-valid
 */
export const isLabelSubgraphValid = (label: Label | null): label is Label => {
  // an unknown label is not subgraph-valid
  // https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/utils.ts#L69
  if (label === null) return false;

  // the label string cannot include any of the documented character codes
  for (let i = 0; i < label.length; i++) {
    if (INVALID_LABEL_CHARACTER_CODES.has(label.charCodeAt(i))) return false;
  }

  // otherwise, the label is subgraph-valid
  return true;
};
