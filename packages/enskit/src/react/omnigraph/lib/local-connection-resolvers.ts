import type { Resolver } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";

interface IntrospectionTypeRef {
  readonly kind: string;
  readonly name?: string;
  readonly ofType?: IntrospectionTypeRef | null;
}

interface IntrospectionField {
  readonly name: string;
  readonly type: IntrospectionTypeRef;
}

interface IntrospectionType {
  readonly kind: string;
  readonly name: string;
  readonly fields?: readonly IntrospectionField[] | null;
}

interface IntrospectionSchema {
  readonly __schema: {
    readonly types: readonly IntrospectionType[];
  };
}

function unwrapType(type: IntrospectionTypeRef): IntrospectionTypeRef {
  return type.ofType ? unwrapType(type.ofType) : type;
}

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
