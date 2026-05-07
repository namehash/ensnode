import type { Resolver, ScalarObject } from "@urql/exchange-graphcache";

import {
  type IntrospectionSchema,
  type IntrospectionTypeRef,
  unwrapType,
} from "./introspection-helpers";

// graphcache's ResolverResult type doesn't include bigint, but the value is stored
// in the normalized cache and returned to the consumer as-is, so bigint works at runtime
// the load-bearing piece of type inference is in packages/enskit/src/react/omnigraph/graphql.ts where
// the GraphQL BigInt Scalar is mapped to the `bigint` primitive, which is only supported by these
// runtime local resolvers.
const toBigInt: Resolver = (parent, args, cache, info) => {
  const value = parent[info.fieldName];
  if (value == null) return value;
  return BigInt(value as string) as unknown as ScalarObject;
};

const toBigIntList: Resolver = (parent, args, cache, info) => {
  const value = parent[info.fieldName];
  if (value == null) return value;

  // now we know value is a (string | null)[], so map to a (bigint | null)[]
  return (value as readonly (string | null)[]).map((v) => (v == null ? v : BigInt(v)));
};

function isBigIntType(type: IntrospectionTypeRef) {
  return unwrapType(type).name === "BigInt";
}

// NOTE: the recursion is to handle not-null-wrapped lists
function isListType(type: IntrospectionTypeRef): boolean {
  if (type.kind === "LIST") return true;
  return type.ofType ? isListType(type.ofType) : false;
}

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
      if (!isBigIntType(field.type)) continue;

      resolvers[type.name] ??= {};
      resolvers[type.name][field.name] = isListType(field.type) ? toBigIntList : toBigInt;
    }
  }

  return resolvers;
}
