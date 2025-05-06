import { deepmergeCustom } from "deepmerge-ts";
import { mergeAbis } from "ponder";
import type { Abi } from "viem";

/**
 * merges ponder configs, using the minimum value of `startBlock` and maximum value of `endBlock`
 * for shared `Resolver` definitions to ensure that no Resolvers are left out.
 */
const mergePonderConfigsWithResolverBlockrange = deepmergeCustom({
  enableImplicitDefaultMerging: true,
  // this metaDataUpdater implementation injects `keyPath` into `meta`
  // via: https://github.com/RebeccaStevens/deepmerge-ts/blob/HEAD/docs/deepmergeCustom.md
  metaDataUpdater: (previousMeta: any, metaMeta: any) => {
    if (previousMeta === undefined) {
      if (metaMeta.key === undefined) {
        return { keyPath: [] };
      }
      return { ...metaMeta, keyPath: [metaMeta.key] };
    }
    if (metaMeta.key === undefined) return previousMeta;
    return {
      ...metaMeta,
      keyPath: [...(previousMeta as any).keyPath, metaMeta.key],
    };
  },
  mergeArrays(values, utils, meta) {
    // if merging any `abi` key, use viem#mergeAbi to avoid duplicates
    if (meta !== undefined && meta.key === "abi") {
      return mergeAbis(values as unknown as Abi[]);
    }
  },
  mergeOthers: (values, utils, meta) => {
    // matches keyPath = [ 'contracts', 'Resolver', 'networks', '1', 'startBlock' ]
    if (
      meta &&
      meta.keyPath.length === 5 && // check depth
      meta.keyPath[0] === "contracts" &&
      meta.keyPath[1] === "Resolver" &&
      meta.keyPath[2] === "network" &&
      meta.keyPath[4] === "startBlock"
    ) {
      // if so, do custom 'minimum startBlock' logic
      return Math.min(...(values as unknown as number[]));
    }

    // matches keyPath = [ 'contracts', 'Resolver', 'networks', '1', 'endBlock' ]
    if (
      meta &&
      meta.keyPath.length === 5 && // check depth
      meta.keyPath[0] === "contracts" &&
      meta.keyPath[1] === "Resolver" &&
      meta.keyPath[2] === "network" &&
      meta.keyPath[4] === "endBlock"
    ) {
      // if so, do custom 'maximum endBlock' logic
      return Math.max(...(values as unknown as number[]));
    }
  },
});

/**
 * Deep merges two ponder configs, casting to the correct type.
 */
export function mergePonderConfigs<
  T extends { [key: string]: any },
  U extends { [key: string]: any },
>(target: T, source: U) {
  return mergePonderConfigsWithResolverBlockrange(target, source);
}
