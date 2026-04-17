import { ENS_ROOT_NAME } from "./constants";
import {
  decodeEncodedLabelHash,
  encodeLabelHash,
  isEncodedLabelHash,
  labelhashInterpretedLabel,
  labelhashLiteralLabel,
} from "./labelhash";
import { isNormalizedLabel, normalizeLabel } from "./normalization";
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
 * Interprets a user-provided {@link LiteralName} as an {@link InterpretedName}.
 *
 * A {@link LiteralName} may be any arbitrary string. The ENS Root Name ('') ({@link ENS_ROOT_NAME})
 * is only accepted when `options.allowENSRootName` is `true`, and is returned as-is.
 *
 * This function walks each LiteralLabel of `name` and maps it to an {@link InterpretedLabel}
 * according to the provided `options`:
 *
 * 0. If the LiteralLabel is an empty string (''), this function throws: an empty Label is not a valid
 *    {@link InterpretedLabel}.
 * 1. If the LiteralLabel is already a normalized LiteralLabel, it is kept as-is.
 * 2. Otherwise, if the LiteralLabel looks like an {@link EncodedLabelHash} (e.g. `[abcd…]`) and
 *    `options.allowEncodedLabelHashes` is `true`, it is kept as-is.
 * 3. Otherwise, the LiteralLabel is unnormalized. If `options.coerceUnnormalizedLabelsToNormalizedLabels` is `false`,
 *    this function throws. Otherwise (default), the LiteralLabel is passed through ENSIP-15 normalization
 *    ({@link normalizeLabel}). If normalization succeeds, the normalized form is used (e.g. `"Vitalik"` →
 *    `"vitalik"`).
 * 4. Otherwise, the LiteralLabel is unnormalizable. If `options.coerceUnnormalizableLabelsToEncodedLabelHashes`
 *    is `true`, the Label is replaced with the EncodedLabelHash of its literal bytes. Otherwise, this
 *    function throws.
 *
 * Note that step 3 gates step 4: if `options.coerceUnnormalizedLabelsToNormalizedLabels` is `false`, the
 * function throws immediately for any unnormalized Label, regardless of whether the Label would have been
 * normalizable and regardless of `options.coerceUnnormalizableLabelsToEncodedLabelHashes`.
 *
 * @param name - The user-provided {@link LiteralName} to interpret.
 * @param options - Controls how the interpretation handles edge cases.
 * @param options.allowENSRootName - When `true`, an empty `name` is accepted and returned as the ENS Root Name.
 *   When `false` (default), an empty `name` throws.
 * @param options.allowEncodedLabelHashes - When `true`, a Label that is already formatted as an
 *   {@link EncodedLabelHash} is preserved verbatim. When `false` (default), such a Label is treated like any other
 *   input and passed through normalization, which will fail and fall through to the unnormalizable-Label handling.
 * @param options.coerceUnnormalizedLabelsToNormalizedLabels - When `true` (default), a Label that is not already
 *   normalized is passed through ENSIP-15 normalization (e.g. `"Vitalik"` → `"vitalik"`). When `false`, any
 *   unnormalized Label causes this function to throw — no normalization is attempted and
 *   `coerceUnnormalizableLabelsToEncodedLabelHashes` is not consulted.
 * @param options.coerceUnnormalizableLabelsToEncodedLabelHashes - When `true`, a Label that cannot be normalized is
 *   replaced with the EncodedLabelHash of its literal bytes. When `false` (default), encountering such a Label causes
 *   this function to throw. Only consulted when `coerceUnnormalizedLabelsToNormalizedLabels` is `true`.
 *
 * @throws if `name` cannot be coerced into an {@link InterpretedName} under the provided `options`.
 *
 * @dev casts to {@link InterpretedLabel} to avoid an additional unnecessary `asInterpretedLabel` pass.
 */
export function literalNameToInterpretedName(
  name: LiteralName,
  {
    allowENSRootName = false,
    allowEncodedLabelHashes = false,
    coerceUnnormalizedLabelsToNormalizedLabels = true,
    coerceUnnormalizableLabelsToEncodedLabelHashes = false,
  }: {
    allowENSRootName?: boolean | undefined;
    allowEncodedLabelHashes?: boolean | undefined;
    coerceUnnormalizedLabelsToNormalizedLabels?: boolean | undefined;
    coerceUnnormalizableLabelsToEncodedLabelHashes?: boolean | undefined;
  } = {},
): InterpretedName {
  if (name === "") {
    if (allowENSRootName) return ENS_ROOT_NAME;

    throw new Error(
      `The ENS Root Name ('') cannot conform to InterpretedName when allowENSRootName is false.`,
    );
  }

  return interpretedLabelsToInterpretedName(
    literalNameToLiteralLabels(name).map((label) => {
      // Sanity Check: No empty Labels
      if (label === "") {
        throw new Error(
          `Name '${name}' cannot conform to InterpretedName because it contains an empty Label segment, which is not a normalized Label.`,
        );
      }

      // if it's already normalized, good to go
      if (isNormalizedLabel(label)) {
        return label as Label as InterpretedLabel;
      }

      // special case: if it's an EncodedLabelHash, and the consumer allows, good to go
      if (allowEncodedLabelHashes && isEncodedLabelHash(label)) {
        return label as Label as InterpretedLabel;
      }

      // if the consumer does not want to allow coercion of unnormalized labels, then there's nothing to do
      if (!coerceUnnormalizedLabelsToNormalizedLabels) {
        throw new Error(
          `Name '${name}' cannot conform to InterpretedName because Label '${label}' is unnormalized and coercion is disabled.`,
        );
      }

      try {
        // attempt to normalize it and pass the normalized Label along
        return normalizeLabel(label);
      } catch {
        // but the label is unnormalizable, so:

        // if the consumer wants to interpret unnormalizable Labels as an EncodedLabelHash, do so
        if (coerceUnnormalizableLabelsToEncodedLabelHashes) {
          return encodeLabelHash(labelhashLiteralLabel(label)) as InterpretedLabel;
        }

        // otherwise, cannot conform
        throw new Error(
          `Name '${name}' cannot conform to InterpretedName because Label '${label}' is unnormalized and cannot be normalized.`,
        );
      }
    }),
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
 * Converts an LiteralName into a list of LiteralLabels.
 */
export function literalNameToLiteralLabels(name: LiteralName): LiteralLabel[] {
  if (name === "") return [];
  return name.split(".") as LiteralLabel[];
}

/**
 * Converts an Interpreted Name into a list of Interpreted Labels.
 */
export function interpretedNameToInterpretedLabels(name: InterpretedName): InterpretedLabel[] {
  if (name === "") return [];
  return name.split(".") as InterpretedLabel[];
}

export function isInterpretedLabel(label: Label): label is InterpretedLabel {
  return isEncodedLabelHash(label) || isNormalizedLabel(label);
}

/**
 * Determines whether `name` is an {@link InterpretedName}.
 * The root name ("") is a valid InterpretedName.
 *
 * @param name
 * @returns
 */
export function isInterpretedName(name: Name): name is InterpretedName {
  if (name === ENS_ROOT_NAME) return true;
  return name.split(".").every(isInterpretedLabel);
}

/**
 * Converts InterpretedLabels into a LabelHashPath.
 */
export function interpretedLabelsToLabelHashPath(labels: InterpretedLabel[]): LabelHashPath {
  return labels
    .map((label) => {
      try {
        // attempt to decode label as an encoded labelhash
        return decodeEncodedLabelHash(label);
      } catch {
        // but if that failed, this must be a normalized label, so labelhash it
        return labelhashInterpretedLabel(label);
      }
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

  if (!concrete.every(isInterpretedLabel)) {
    throw new Error(
      `Invariant(parsePartialInterpretedName): Concrete portion of Partial InterpretedName contains segments that are not InterpretedLabels.\n${JSON.stringify(concrete)}`,
    );
  }

  return { concrete, partial };
}

/**
 * Casts a string to a {@link LiteralName}.
 *
 * A LiteralName is a name that should be interpreted as a string literal. It may or may not be
 * normalized or normalizable. It may also include labels formatted as an EncodedLabelHash, but
 * such labels must be interpreted literally and not as an EncodedLabelHash.
 */
export function asLiteralName(name: Name): LiteralName {
  return name as LiteralName;
}

/**
 * Casts a string to a {@link LiteralLabel}.
 *
 * A LiteralLabel is a label that should be interpreted as a string literal. It may or may not be
 * normalized or normalizable. It may also be formatted as an EncodedLabelHash, but such labels must
 * be interpreted literally and not as an EncodedLabelHash.
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
  if (isInterpretedLabel(label)) return label;

  throw new Error(`Not a valid InterpretedLabel: '${label}'`);
}

/**
 * Validates and casts a string to an {@link InterpretedName}.
 * An InterpretedName is either the ENS Root Name ('') or a name made up of InterpretedLabels (which
 * are either normalized Labels or EncodedLabelHashes).
 *
 * @throws if the input cannot be interpreted into an InterpretedName
 */
export function asInterpretedName(name: Name): InterpretedName {
  if (isInterpretedName(name)) return name;

  throw new Error(`Not a valid InterpretedName: '${name}'`);
}
