import type { Resolver } from "@urql/exchange-graphcache";

/**
 * deep-merge resolver maps so types appearing in both get all their field resolvers
 */
export function mergeResolverMaps<RESOLVER extends Resolver>(
  ...maps: Record<string, Record<string, RESOLVER>>[]
): Record<string, Record<string, RESOLVER>> {
  const result: Record<string, Record<string, RESOLVER>> = {};
  for (const map of maps) {
    for (const [typeName, fields] of Object.entries(map)) {
      result[typeName] = { ...result[typeName], ...fields };
    }
  }
  return result;
}
