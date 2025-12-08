/**
 * A mapped type that filters a schema object by a prefix and removes the prefix from the keys.
 *
 * This type transformation takes all keys from SCHEMA that start with PREFIX, removes the prefix
 * from those keys, and preserves the original value types. Keys that don't match the prefix are excluded.
 *
 * @template PREFIX - The string prefix to filter by
 * @template SCHEMA - The input schema object type
 */
type FilteredSchema<PREFIX extends string, SCHEMA extends Record<string, unknown>> = {
  [K in keyof SCHEMA as K extends `${PREFIX}${infer Rest}` ? Rest : never]: SCHEMA[K];
};

/**
 * Filters and transforms a schema object by selecting only properties with keys that start with a given prefix,
 * then strips the prefix from the keys while preserving the original value types.
 *
 * This function is particularly useful for extracting subsets of Drizzle/Ponder schemas where tables or
 * relationships follow a naming convention with prefixes (e.g., "plugin_table", "namespace_relation").
 *
 * @param prefix - The string prefix to filter by (case-sensitive). Only keys starting with this prefix will be included
 * @param schema - The input schema object containing tables, relationships, or other named entities
 * @returns A new object with filtered entries where:
 *   - Keys: Original keys with the prefix removed (e.g., "plugin_users" → "users")
 *   - Values: Preserved exactly as they were in the original schema with their original types
 *
 * @example
 * ```typescript
 * const schema = {
 *   plugin_users: userTable,
 *   plugin_posts: postTable,
 *   other_table: otherTable,
 * } as const;
 *
 * const filtered = filterSchemaByPrefix("plugin_", schema);
 * // Result: { users: userTable, posts: postTable }
 * // Types are preserved: typeof filtered.users === typeof schema.plugin_users
 * ```
 */
export function filterSchemaByPrefix<PREFIX extends string, SCHEMA extends Record<string, unknown>>(
  prefix: PREFIX,
  schema: SCHEMA,
): FilteredSchema<PREFIX, SCHEMA> {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([name]) => name.startsWith(prefix))
      .map(([name, value]) => [name.slice(prefix.length), value]),
  ) as FilteredSchema<PREFIX, SCHEMA>;
}
