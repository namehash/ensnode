/**
 * Adds a prefix to all keys in a schema object while preserving the original value types.
 *
 * This function is useful for namespacing schema objects to avoid conflicts when merging
 * multiple schemas together, particularly in Drizzle/Ponder schema systems.
 *
 * @param prefix - The string prefix to add to all keys
 * @param schema - The input schema object containing tables, relationships, or other named entities
 * @returns A new object with all keys prefixed and original values preserved
 *
 * @example
 * ```typescript
 * const schema = {
 *   users: userTable,
 *   posts: postTable,
 * } as const;
 *
 * const prefixed = prefixSchema("subgraph_", schema);
 * // Result: { subgraph_users: userTable, subgraph_posts: postTable }
 * // Types are preserved: typeof prefixed.subgraph_users === typeof schema.users
 * ```
 */

type PrefixedSchema<PREFIX extends string, SCHEMA extends Record<string, unknown>> = {
  [K in keyof SCHEMA as `${PREFIX}${K & string}`]: SCHEMA[K];
};

export function prefixSchema<PREFIX extends string, SCHEMA extends Record<string, unknown>>(
  prefix: PREFIX,
  schema: SCHEMA,
): PrefixedSchema<PREFIX, SCHEMA> {
  const result = Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [`${prefix}${key}`, value]),
  );

  return result as PrefixedSchema<PREFIX, SCHEMA>;
}