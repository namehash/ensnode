import type { Label, Name } from "./types";

/**
 * Constructs a name hierarchy from a given Name.
 * i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
 */
export const getNameHierarchy = (name: Name): Name[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join("."));

/**
 * Gets the first label from an Interpreted Name
 *
 * @param name
 * @returns The first Interpreted Label or null in the case of the ENS root.
 */
export const getFirstLabel = (name: Name): Label | null => {
  return name.split(".")[0] ?? null;
};
