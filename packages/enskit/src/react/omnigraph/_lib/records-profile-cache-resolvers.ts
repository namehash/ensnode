import type { Cache, ResolveInfo, Resolver, Variables } from "@urql/exchange-graphcache";

/**
 * Delegates to graphcache network resolution when no cached entity is found locally.
 */
const passthrough = (args: Variables, cache: Cache, info: ResolveInfo) =>
  cache.resolve(info.parentTypeName, info.fieldName, args);

const asEntityKey = (value: unknown): string | null => (typeof value === "string" ? value : null);

const lookupCachedRecordsByInterpretedName = (cache: Cache, interpretedName: string) => {
  const key = cache.keyOfEntity({ __typename: "ResolvedRecords", id: interpretedName });
  if (key && cache.resolve(key, "id")) return key;
  return undefined;
};

const resolveInterpretedNameFromCanonical = (cache: Cache, parentKey: string): string | null => {
  const canonicalKey = asEntityKey(cache.resolve(parentKey, "canonical"));
  if (!canonicalKey) return null;

  const nameKey = asEntityKey(cache.resolve(canonicalKey, "name"));
  if (!nameKey) return null;

  const interpreted = cache.resolve(nameKey, "interpreted");
  return typeof interpreted === "string" ? interpreted : null;
};

const resolveInterpretedNameFromPrimaryNameRecord = (
  cache: Cache,
  parentKey: string,
): string | null => {
  const nameKey = asEntityKey(cache.resolve(parentKey, "name"));
  if (!nameKey) return null;

  const interpreted = cache.resolve(nameKey, "interpreted");
  return typeof interpreted === "string" ? interpreted : null;
};

const resolveRecordsFromParentName: Resolver = (parent, args, cache, info) => {
  const parentKey = asEntityKey(parent);
  if (!parentKey) return passthrough(args, cache, info);

  const interpreted =
    info.parentTypeName === "PrimaryNameRecord" || info.parentTypeName === "PrimaryNameResolve"
      ? resolveInterpretedNameFromPrimaryNameRecord(cache, parentKey)
      : resolveInterpretedNameFromCanonical(cache, parentKey);

  if (interpreted) {
    const cached = lookupCachedRecordsByInterpretedName(cache, interpreted);
    if (cached) return cached;
  }

  return passthrough(args, cache, info);
};

export const recordsProfileCacheResolvers: Record<string, Record<string, Resolver>> = {
  DomainResolve: {
    records: resolveRecordsFromParentName,
  },
  PrimaryNameResolve: {
    records: resolveRecordsFromParentName,
  },
};
