import { isNormalizedName } from "./is-normalized";
import type { InterpretedLabel, InterpretedName, Name, NormalizedName } from "./types";

/**
 * Constructs a name hierarchy from a given Name.
 * i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
 */
export const getNameHierarchy = (name: NormalizedName): NormalizedName[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join(".")) as NormalizedName[];

/**
 * Casts a Name input as a NormalizedName, if possible.
 *
 * @param name
 * @returns NormalizedName
 * @throws if `name` is not normalized.
 */
export const asNormalizedName = (name: Name): NormalizedName => {
  if (!isNormalizedName) {
    throw new Error(`Name '${name}' is not normalized and cannot be cast as NormalizedName.`);
  }

  return name as NormalizedName;
};

/**
 * Gets the first label from an Interpreted Name.
 *
 * @param name
 * @returns The first Interpreted Label or null in the case of the ENS root.
 */
export const getFirstLabel = (name: InterpretedName): InterpretedLabel | null => {
  // ENS Root has no first label
  if (name === "") return null;

  const firstLabel = name.split(".")[0];
  if (firstLabel === undefined) {
    throw new Error(
      `Invariant(getFirstLabel): InterpretedName '${name}' does not have a firstLabel (???)`,
    );
  }

  // we know that all labels in an InterpretedName are InterpretedLabels
  return firstLabel as InterpretedLabel;
};
