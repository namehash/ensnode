import { isHex } from "viem";

import {
  encodeLabelHash,
  isEncodedLabelHash,
  labelhashInterpretedLabel,
  labelhashLiteralLabel,
} from "./labelhash";
import { isNormalizedLabel } from "./normalization";
import type {
  InterpretedLabel,
  InterpretedName,
  Label,
  LabelHash,
  LabelHashPath,
  LiteralLabel,
  LiteralName,
  Name,
} from "./types";

/**
 * Interprets a Name as an InterpretedName.
 * @throws if the provided `name` cannot conform to InterpretedName.
 *
 * @dev encodes unnormalized labels in `name` to make it InterpretedName.
 * @dev this is similar to the concept of Reinterpretation (packages/enssdk/src/lib/reinterpretation.ts)
 *   but is distinct.
 */
export function nameToInterpretedName(name: Name): InterpretedName {
  return interpretedLabelsToInterpretedName(
    name
      .split(".")
      .map((label) => {
        if (isEncodedLabelHash(label)) return label;
        if (isNormalizedLabel(label)) return label;
        return encodeLabelHash(labelhashLiteralLabel(asLiteralLabel(label)));
      })
      .map(asInterpretedLabel),
  );
}

/**
 * Interprets a Literal Label, producing an Interpreted Label.
 *
 * @see https://ensnode.io/docs/reference/terminology#literal-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 *
 * @param label - The Literal Label string to interpret
 * @returns The provided label if it is a normalized label, else the EncodedLabelHash of the label
 */
export function literalLabelToInterpretedLabel(label: LiteralLabel): InterpretedLabel {
  // if the label is normalized, good to go
  if (isNormalizedLabel(label)) return label as Label as InterpretedLabel;

  // otherwise, encode the labelhash of the literal Label
  return encodeLabelHash(labelhashLiteralLabel(label)) as InterpretedLabel;
}

/**
 * Interprets an ordered list of Literal Labels, producing an Interpreted Name.
 *
 * Note that it's important that the Literal Labels are provided as an array, otherwise it's
 * impossible to differentiate between 'a.label.eth' being ['a.label', 'eth'] or ['a', 'label', 'eth'].
 *
 * Note that the input is an ordered list of _Literal_ Labels: in this context, any literal label
 * that is formatted as an Encoded LabelHash will NOT be interpreted as such. Instead it will be
 * interpreted into an Encoded LabelHash that encodes the literal labelhash of the Literal Label.
 *
 * @param labels An ordered list of 0 or more Literal Labels
 * @returns An InterpretedName
 */
export function literalLabelsToInterpretedName(labels: LiteralLabel[]): InterpretedName {
  return labels.map(literalLabelToInterpretedLabel).join(".") as InterpretedName;
}

/**
 * Joins the list of Interpreted Labels with '.' to form an Interpreted Name.
 *
 * @param labels An ordered list of 0 or more Interpreted Labels
 * @returns An InterpretedName
 */
export function interpretedLabelsToInterpretedName(labels: InterpretedLabel[]): InterpretedName {
  return labels.join(".") as InterpretedName;
}

/**
 * Joins the list of Literal Labels with '.' to form a Literal Name.
 *
 * Note: LiteralLabel values may contain '.' characters, which will be preserved
 * in the resulting LiteralName. Therefore, the number of labels in the returned
 * LiteralName may be greater than the number of LiteralLabels in the input array.
 *
 * @param labels An ordered list of 0 or more Literal Labels
 * @returns An LiteralName
 */
export function literalLabelsToLiteralName(labels: LiteralLabel[]): LiteralName {
  return labels.join(".") as LiteralName;
}

/**
 * Converts an Interpreted Name into a list of Interpreted Labels.
 */
export function interpretedNameToInterpretedLabels(name: InterpretedName): InterpretedLabel[] {
  return name.split(".") as InterpretedLabel[];
}

// https://github.com/wevm/viem/blob/main/src/utils/ens/encodedLabelToLabelhash.ts
export function encodedLabelToLabelhash(label: string): LabelHash | null {
  if (label.length !== 66) return null;
  if (label.indexOf("[") !== 0) return null;
  if (label.indexOf("]") !== 65) return null;
  const hash = `0x${label.slice(1, 65)}`;
  if (!isHex(hash)) return null;
  return hash;
}

export function isInterpetedLabel(label: Label): label is InterpretedLabel {
  // if it looks like an encoded labelhash, it must be one
  if (label.startsWith("[")) {
    const labelHash = encodedLabelToLabelhash(label);
    return labelHash != null;
  }

  // otherwise label must be normalized
  return isNormalizedLabel(label);
}

/**
 * Determines whether `name` is an {@link InterpretedName}.
 * The root name ("") is a valid InterpretedName.
 *
 * @param name
 * @returns
 */
export function isInterpretedName(name: Name): name is InterpretedName {
  if (name === "") return true;
  return name.split(".").every(isInterpetedLabel);
}

/**
 * Converts InterpretedLabels into a LabelHashPath.
 */
export function interpretedLabelsToLabelHashPath(labels: InterpretedLabel[]): LabelHashPath {
  return labels
    .map((label) => {
      if (!isInterpetedLabel(label)) {
        throw new Error(
          `Invariant(interpretedLabelsToLabelHashPath): Expected InterpretedLabel, received '${label}'.`,
        );
      }

      // if it looks like an encoded labelhash, return it
      const maybeLabelHash = encodedLabelToLabelhash(label);
      if (maybeLabelHash !== null) return maybeLabelHash;

      // otherwise, labelhash it
      return labelhashInterpretedLabel(label);
    })
    .toReversed();
}

/**
 * Constructs a new InterpretedName from an InterpretedLabel (child) and InterpretedName (parent).
 *
 * If no parent is available the InterpretedLabel is cast to an InterpretedName and returned.
 *
 * @dev the following is safe due to InterpretedLabel/InterpretedName semantics, see above.
 */
export function constructSubInterpretedName(
  label: InterpretedLabel,
  name: InterpretedName | undefined,
): InterpretedName {
  if (name === undefined || name === "") return label as Name as InterpretedName;
  return [label, name].join(".") as InterpretedName;
}

/**
 * Given a `labelHash` and optionally its healed InterpretedLabel, return an InterpretedLabel.
 */
export function ensureInterpretedLabel(
  labelHash: LabelHash,
  label: InterpretedLabel | undefined,
): InterpretedLabel {
  return label ?? (encodeLabelHash(labelHash) as InterpretedLabel);
}

/**
 * Parses a Partial InterpretedName into concrete InterpretedLabels and the partial Label.
 *
 * @example
 * ```ts
 * const result = parsePartialInterpretedName("example.et")
 * // { concrete: ["example"], partial: "et" }
 * ```
 *
 * @throws if the provided `partialInterpretedName` is not composed of concrete InterpretedLabels.
 */
export function parsePartialInterpretedName(partialInterpretedName: Name): {
  concrete: InterpretedLabel[];
  partial: string;
} {
  if (partialInterpretedName === "") return { concrete: [], partial: "" };

  const concrete = partialInterpretedName.split(".");
  // note that the concrete.pop mutates `concrete` to exclude the last element
  // biome-ignore lint/style/noNonNullAssertion: there's always at least one element after a .split
  const partial = concrete.pop()!;

  if (!concrete.every(isInterpetedLabel)) {
    throw new Error(
      `Invariant(parsePartialInterpretedName): Concrete portion of Partial InterpretedName contains segments that are not InterpretedLabels.\n${JSON.stringify(concrete)}`,
    );
  }

  return { concrete, partial };
}

/**
 * Validates and casts a string to a {@link LiteralLabel}.
 * A LiteralLabel is a label as it literally appears onchain.
 */
export function asLiteralLabel(label: Label): LiteralLabel {
  return label as LiteralLabel;
}

/**
 * Validates and casts a string to an {@link InterpretedLabel}.
 * An InterpretedLabel is either a normalized label or an EncodedLabelHash.
 *
 * @throws if the input is not a valid InterpretedLabel
 */
export function asInterpretedLabel(label: Label): InterpretedLabel {
  if (isInterpetedLabel(label)) return label;

  throw new Error(`Not a valid InterpretedLabel: '${label}'`);
}

/**
 * Validates and casts a string to an {@link InterpretedName}.
 * An InterpretedName is composed entirely of InterpretedLabels joined by dots.
 *
 * @throws if the input cannot be interpreted into an InterpretedName
 */
export function asInterpretedName(name: Name): InterpretedName {
  if (isInterpretedName(name)) return name;

  throw new Error(`Not a valid InterpretedName: '${name}'`);
}
