/**
 * A factory function that returns a function to create a name-spaced contract name for Ponder indexing handlers.
 *
 * Ponder config requires a flat dictionary of contract config entires, where each entry has its unique name and set of EVM event names derived from the contract's ABI.
 * Ponder will use contract names and their respective event names to create names for indexing handlers.
 * For example, a contract named  `Registry` includes events: `NewResolver` and `NewTTL`. Ponder will create indexing handlers named `Registry:NewResolver` and `Registry:NewTTL`.
 *
 * However, in some cases, we may want to create a name-spaced contract name to distinguish between contracts having the same name, but handling different implementations.
 *
 * Let's say we have two contracts named `Registry`. One handles the `eth` name, and the other handles the `base.eth` subname. We need to create a name-spaced contract name to avoid conflicts.
 * We could use the actual name/subname as a prefix, like `eth/Registry` and `base.eth/Registry`. We cannot do that, though, as Ponder does not support dots and colons in its indexing handler names.
 *
 * We need to use a different separator, in this case, a forward slash in a path-like format.
 *
 * @param subname
 *
 * @example
 * ```ts
 * const ethNs = createPluginNamespace("base.eth");
 * const baseEthNs = createPluginNamespace("base.eth");
 *
 * ethNs("Registry"); // returns "/eth/Registry"
 * baseEthNs("Registry"); // returns "/base/eth/Registry"
 * ```
 */
export function createPluginNamespace<Subname extends EthSubname>(subname: Subname) {
  const path = transformDomain(subname) satisfies PonderNsPath;

  /** Creates a name-spaced contract name */
  return function pluginNamespace<ContractName extends string>(
    contractName: ContractName,
  ): PonderNamespaceReturnType<ContractName, typeof path> {
    return `${path}/${contractName}`;
  };
}

type TransformDomain<T extends string> = T extends `${infer Sub}.${infer Rest}`
  ? `/${TransformDomain<Rest>}/${Sub}`
  : `/${T}`;

/**
 * Transforms a domain name into a path-like format
 *
 * @param domain
 * @returns path-like format of the reversed domain
 *
 * @example
 * ```ts
 * transformDomain("base.eth"); // returns "/eth/base"
 **/
function transformDomain<T extends string>(domain: T): TransformDomain<T> {
  const parts = domain.split(".").reverse();
  return `/${parts.join("/")}` as TransformDomain<T>;
}

/** The return type of the `pluginNamespace` function */
export type PonderNamespaceReturnType<
  ContractName extends string,
  NsPath extends PonderNsPath,
> = `${NsPath}/${ContractName}`;

type PonderNsPath<T extends PonderNsPath = "/"> = `` | `/${string}` | `/${string}${T}`;

type EthSubname = `${string}eth`;
