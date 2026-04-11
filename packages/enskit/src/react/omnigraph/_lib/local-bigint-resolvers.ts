import type { Resolver, ScalarObject } from "@urql/exchange-graphcache";

import { type IntrospectionSchema, unwrapType } from "./introspection-helpers";

// graphcache's ResolverResult type doesn't include bigint, but the value is stored
// in the normalized cache and returned to the consumer as-is, so bigint works at runtime
// the load-bearing piece of
const toBigInt: Resolver = (parent, args, cache, info) => {
  const value = parent[info.fieldName];
  if (value == null) return value;
  return BigInt(value as string) as unknown as ScalarObject;
};

/**
 * Derives local resolvers that parse BigInt scalar fields from cached strings into native bigint.
 */
export function localBigIntResolvers(
  schema: IntrospectionSchema,
): Record<string, Record<string, Resolver>> {
  const resolvers: Record<string, Record<string, Resolver>> = {};

  for (const type of schema.__schema.types) {
    if (type.kind !== "OBJECT" || type.name.startsWith("__")) continue;

    for (const field of type.fields ?? []) {
      const leaf = unwrapType(field.type);
      if (leaf.name === "BigInt") {
        resolvers[type.name] ??= {};
        resolvers[type.name][field.name] = toBigInt;
      }
    }
  }

  return resolvers;
}
