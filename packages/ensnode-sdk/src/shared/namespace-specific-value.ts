import type { ENSNamespaceId } from "@ensnode/datasources";

/**
 * A value that varies by ENS namespace, with a required default.
 *
 * @example
 * ```ts
 * const exampleNames: NamespaceSpecificValue<string[]> = {
 *   default: ["vitalik.eth", "nick.eth"],
 *   [ENSNamespaceIds.EnsTestEnv]: ["test.eth", "demo.eth"],
 * };
 * ```
 */
export type NamespaceSpecificValue<T> = { default: T } & Partial<Record<ENSNamespaceId, T>>;

/**
 * Resolves a {@link NamespaceSpecificValue} for a given namespace,
 * falling back to the default.
 */
export function getNamespaceSpecificValue<T>(
  namespace: ENSNamespaceId,
  value: NamespaceSpecificValue<T>,
): T {
  return value[namespace] ?? value.default;
}
