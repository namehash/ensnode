import type { Resolver } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";

import { type IntrospectionSchema, unwrapType } from "./introspection-helpers";

/**
 * Derives `relayPagination()` local resolvers for all connection fields in the schema.
 */
export function localConnectionResolvers(
  schema: IntrospectionSchema,
): Record<string, Record<string, Resolver>> {
  const resolvers: Record<string, Record<string, Resolver>> = {};

  for (const type of schema.__schema.types) {
    if (type.kind !== "OBJECT" || type.name.startsWith("__")) continue;

    for (const field of type.fields ?? []) {
      const leaf = unwrapType(field.type);
      if (leaf.name?.endsWith("Connection")) {
        resolvers[type.name] ??= {};
        resolvers[type.name][field.name] = relayPagination();
      }
    }
  }

  return resolvers;
}
