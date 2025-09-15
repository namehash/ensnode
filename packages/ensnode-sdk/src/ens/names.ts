import type { NormalizedName } from "./types";

/**
 * Constructs a name hierarchy from a given NormalizedName.
 *
 * @example
 * ```
 * getNameHierarchy("sub.example.eth") -> ["sub.example.eth", "example.eth", "eth"]
 * ```
 *
 * @dev by restricting the input type to NormalizedName we guarantee that we can split and join
 * on '.' and receive NormalizedNames as a result
 */
export const getNameHierarchy = (name: NormalizedName): NormalizedName[] =>
  name.split(".").map((_, i, labels) => labels.slice(i).join(".")) as NormalizedName[];
