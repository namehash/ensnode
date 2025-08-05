import type { Name } from "./types";

/**
 * Constructs a name hierarchy from a given Name.
 * i.e. sub.example.eth -> [sub.example.eth, example.eth, eth]
 */
export const getNameHierarchy = (name: Name): Name[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join("."));
