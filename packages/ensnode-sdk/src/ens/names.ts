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
