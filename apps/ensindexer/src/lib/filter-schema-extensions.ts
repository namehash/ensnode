/**
 * Filters out `ext_`-prefixed tables/relationships from a drizzle/ponder schema.
 */
export function filterSchemaExtensions<SCHEMA extends Record<string, unknown>>(
  schema: SCHEMA,
): SCHEMA {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([name]) => !name.startsWith("ext_"))
      .map(([name, value]) => [name, value]),
  ) as SCHEMA;
}
