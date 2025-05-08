/**
 * This is a graphql schema generated from a drizzle (sql) schema, initially based on ponder's.
 * https://github.com/ponder-sh/ponder/blob/main/packages/core/src/graphql/index.ts
 *
 * Its goal is to mimic the subgraph graphql api for queries we've deemed relevant (see docs).
 *
 * 1. inlines some ponder internal types
 * 2. implement subgraph's simpler offset pagination with first & skip w/out Page types
 * 3. PascalCase entity names
 * 4. Polymorphic Interfaces
 * 5. lower-case and/or filters
 * 6. relation id shorthand filters (i.e. domains(where: { owner_id: String }))
 * 7. sortable id columns
 * 8. temporarily ignores column normalization that was fixed in
 *    https://github.com/ponder-sh/ponder/pull/1517/files
 */

// here we inline the following types from this original import
// import type { Drizzle, OnchainTable, Schema } from "ponder";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";

export type Drizzle<TSchema extends Schema = { [name: string]: never }> =
  | NodePgDatabase<TSchema>
  | PgliteDatabase<TSchema>;

export type Schema = { [name: string]: unknown };

export const onchain = Symbol.for("ponder:onchain");

export type OnchainTable<
  T extends TableConfig & {
    extra: PgTableExtraConfig | undefined;
  } = TableConfig & { extra: PgTableExtraConfig | undefined },
> = PgTable<T> & {
  [Key in keyof T["columns"]]: T["columns"][Key];
} & { [onchain]: true } & {
  enableRLS: () => Omit<OnchainTable<T>, "enableRLS">;
};

import DataLoader from "dataloader";
import {
  type Column,
  Many,
  One,
  type SQL,
  Subquery,
  type TableRelationalConfig,
  and,
  arrayContained,
  arrayContains,
  asc,
  createTableRelationsHelpers,
  desc,
  eq,
  extractTablesRelationalConfig,
  getTableColumns,
  getTableUniqueName,
  gt,
  gte,
  inArray,
  is,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  notLike,
  or,
  relations,
  sql,
} from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import {
  type PgColumnBuilderBase,
  PgDialect,
  type PgEnum,
  PgEnumColumn,
  PgInteger,
  PgSerial,
  PgTable,
  PgTableExtraConfig,
  TableConfig,
  isPgEnum,
  pgTable,
} from "drizzle-orm/pg-core";
import { PgViewBase } from "drizzle-orm/pg-core/view-base";
import { Relation } from "drizzle-orm/relations";
import {
  GraphQLBoolean,
  GraphQLEnumType,
  type GraphQLEnumValueConfigMap,
  type GraphQLFieldConfig,
  type GraphQLFieldConfigMap,
  GraphQLFloat,
  type GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  type GraphQLInputType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  type GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { GraphQLJSON } from "graphql-scalars";

import { capitalize, intersectionOf } from "./helpers";
import { deserialize, serialize } from "./serialize";
import type { PonderMetadataProvider } from "./types";

type Parent = Record<string, any>;
type Context = {
  getDataLoader: ReturnType<typeof buildDataLoaderCache>;
  drizzle: Drizzle<{ [key: string]: OnchainTable }>;
};

// NOTE: subgraph-style pagination
type PluralArgs = {
  where?: { [key: string]: number | string };
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
};

// NOTE: subgraph defaults to 100 entities in a plural
const DEFAULT_LIMIT = 100 as const;
// NOTE: subgraph also has a max of 1000 entities in a plural
const MAX_LIMIT = 1000 as const;

// subgraph uses an OrderDirection Enum rather than string union
const OrderDirectionEnum = new GraphQLEnumType({
  name: "OrderDirection",
  values: {
    asc: { value: "asc" },
    desc: { value: "desc" },
  },
});

/**
 * the following type describes:
 * 1. `types` — mapping a polymorphic type name to the set of entities that implement that interface
 *   ex: DomainEvent -> [TransferEvent, ...]
 * 2. `fields` — mapping a typeName to the polymorphic type it represents
 *   ex: Domain.events -> DomainEvent
 *
 * NOTE: in future implementations of ponder, this information could be provided by the schema
 * using materialized views, and most/all of this code can be removed.
 */
export interface PolymorphicConfig {
  types: Record<string, PgTable<TableConfig>[]>;
  fields: Record<string, string>;
}

interface BuildGraphQLSchemaOptions {
  schema: Schema;
  polymorphicConfig?: PolymorphicConfig;
  metadataProvider: PonderMetadataProvider;
}

export function buildGraphQLSchema({
  schema: _schema,
  polymorphicConfig: _polymorphicConfig,
  metadataProvider,
}: BuildGraphQLSchemaOptions): GraphQLSchema {
  const polymorphicConfig = _polymorphicConfig ?? { types: {}, fields: {} };

  // copy schema to avoid injecting `intersection_table`s into ponder's schema object
  const schema: Schema = { ..._schema };

  // first, construct TablesRelationConfig with the existing schema. this is necessary because
  // we need access to relations by table, which this helper resolves
  const _tablesConfig = extractTablesRelationalConfig(schema, createTableRelationsHelpers);

  // next, remap polymorphicConfig.types to interfaceTypeName -> implementing TableRelationalConfig[]
  const polymorphicTableConfigs = Object.fromEntries(
    Object.entries(polymorphicConfig.types).map(([interfaceTypeName, implementingTables]) => [
      interfaceTypeName,
      implementingTables
        .map((table) => getTableUniqueName(table))
        .map((tableName) => _tablesConfig.tables[_tablesConfig.tableNamesMap[tableName]!]!),
    ]),
  );

  // use this TablesRelationalConfig to generate the intersection table & relationships
  // and inject our 'fake' intersection tables into the schema so filters and orderBy entities are
  // auto generated as normal.
  Object.assign(
    schema,
    ...Object.keys(polymorphicConfig.types).map((interfaceTypeName) =>
      getIntersectionTableSchema(interfaceTypeName, polymorphicTableConfigs[interfaceTypeName]!),
    ),
  );

  // restructure `Type.fieldName` into `[Type, fieldName]` for simpler logic later
  const polymorphicFields = Object.entries(polymorphicConfig.fields)
    // split fieldPath into segments
    .map<[[string, string], string]>(([fieldPath, interfaceTypeName]) => [
      fieldPath.split(".") as [string, string],
      interfaceTypeName,
    ]);

  const tablesConfig = extractTablesRelationalConfig(schema, createTableRelationsHelpers);
  const tables = Object.values(tablesConfig.tables) as TableRelationalConfig[];

  const enums = Object.entries(schema).filter((el): el is [string, PgEnum<[string, ...string[]]>] =>
    isPgEnum(el[1]),
  );
  const enumTypes: Record<string, GraphQLEnumType> = {};
  for (const [enumTsName, enumObject] of enums) {
    // Note that this is keyed by enumName (the SQL name) because that's what is
    // available on the PgEnumColumn type. See `columnToGraphQLCore` for context.
    enumTypes[enumObject.enumName] = new GraphQLEnumType({
      name: enumTsName,
      values: enumObject.enumValues.reduce(
        (acc: Record<string, {}>, cur) => ({ ...acc, [cur]: {} }),
        {},
      ),
    });
  }

  // construct Entity_orderBy enums
  const entityOrderByEnums: Record<string, GraphQLEnumType> = {};
  for (const table of tables) {
    // Scalar fields
    const values = Object.keys(table.columns).reduce<GraphQLEnumValueConfigMap>(
      (acc, columnName) => ({
        ...acc,
        [columnName]: { value: columnName },
      }),
      {},
    );

    // NOTE: if implementing single-level nested OrderBy relationships i.e. orderBy: parent__labelName
    // here is where you'd do it

    entityOrderByEnums[table.tsName] = new GraphQLEnumType({
      name: `${getSubgraphEntityName(table.tsName)}_orderBy`,
      values,
    });
  }

  const entityFilterTypes: Record<string, GraphQLInputObjectType> = {};
  for (const table of tables) {
    const filterType = new GraphQLInputObjectType({
      name: `${getSubgraphEntityName(table.tsName)}_filter`,
      fields: () => {
        const filterFields: GraphQLInputFieldConfigMap = {
          // Logical operators
          // NOTE: lower case and/or
          and: { type: new GraphQLList(filterType) },
          or: { type: new GraphQLList(filterType) },
        };

        for (const [columnName, column] of Object.entries(table.columns)) {
          const type = columnToGraphQLCore(column, enumTypes);

          // List fields => universal, plural
          if (type instanceof GraphQLList) {
            const baseType = innerType(type);

            conditionSuffixes.universal.forEach((suffix) => {
              filterFields[`${columnName}${suffix}`] = {
                type: new GraphQLList(baseType),
              };
            });

            conditionSuffixes.plural.forEach((suffix) => {
              filterFields[`${columnName}${suffix}`] = { type: baseType };
            });
          }

          // JSON => no filters.
          // Boolean => universal and singular only.
          // All other scalar => universal, singular, numeric OR string depending on type
          if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) {
            if (type.name === "JSON") continue;

            conditionSuffixes.universal.forEach((suffix) => {
              filterFields[`${columnName}${suffix}`] = {
                type,
              };
            });

            conditionSuffixes.singular.forEach((suffix) => {
              filterFields[`${columnName}${suffix}`] = {
                type: new GraphQLList(type),
              };
            });

            if (["String", "ID"].includes(type.name)) {
              conditionSuffixes.string.forEach((suffix) => {
                filterFields[`${columnName}${suffix}`] = {
                  type: type,
                };
              });

              // NOTE: support lexigraphical gt/lt filters for string ids
              conditionSuffixes.numeric.forEach((suffix) => {
                filterFields[`${columnName}${suffix}`] = {
                  type: type,
                };
              });
            }

            if (["Int", "Float", "BigInt"].includes(type.name)) {
              conditionSuffixes.numeric.forEach((suffix) => {
                filterFields[`${columnName}${suffix}`] = {
                  type: type,
                };
              });
            }
          }
        }

        // NOTE: add support for relational filters like Domain_filter's { owner_not: String }
        for (const [relationName, relation] of Object.entries(table.relations)) {
          if (is(relation, One)) {
            // TODO: get the type of the relation's reference column & make this like above
            // NOTE: for now, hardcode that singular relation filters are string ids
            conditionSuffixes.universal.forEach((suffix) => {
              filterFields[`${relation.fieldName}${suffix}`] = {
                type: GraphQLString,
              };
            });
          }
        }

        return filterFields;
      },
    });
    entityFilterTypes[table.tsName] = filterType;
  }

  const entityTypes: Record<string, GraphQLObjectType<Parent, Context>> = {};
  const interfaceTypes: Record<string, GraphQLInterfaceType> = {};
  const entityPageTypes: Record<string, GraphQLOutputType> = {};

  // for each polymorphic interface type name
  for (const interfaceTypeName of Object.keys(polymorphicTableConfigs)) {
    const table = tablesConfig.tables[interfaceTypeName]!;

    // construct a GraphQLInterfaceType representing the intersection table
    interfaceTypes[interfaceTypeName] = new GraphQLInterfaceType({
      name: interfaceTypeName,
      fields: () => {
        const fieldConfigMap: GraphQLFieldConfigMap<Parent, Context> = {};

        for (const [columnName, column] of Object.entries(table.columns)) {
          const type = columnToGraphQLCore(column, enumTypes);
          fieldConfigMap[columnName] = {
            type: column.notNull ? new GraphQLNonNull(type) : type,
          };
        }

        return fieldConfigMap;
      },
    });
  }

  // construct object type for each entity
  for (const table of tables) {
    // don't make entityTypes for our fake intersection tables
    if (isInterfaceType(polymorphicConfig, table.tsName)) continue;

    const entityTypeName = getSubgraphEntityName(table.tsName);
    entityTypes[table.tsName] = new GraphQLObjectType({
      name: entityTypeName,
      interfaces: Object.entries(polymorphicTableConfigs)
        // if this entity implements an interface...
        .filter(([, implementingTables]) =>
          implementingTables.map((table) => table.tsName).includes(table.tsName),
        )
        // include the interfaceType here
        .map(([interfaceTypeName]) => interfaceTypes[interfaceTypeName]!),
      fields: () => {
        const fieldConfigMap: GraphQLFieldConfigMap<Parent, Context> = {};

        // Scalar fields
        for (const [columnName, column] of Object.entries(table.columns)) {
          const type = columnToGraphQLCore(column, enumTypes);
          fieldConfigMap[columnName] = {
            type: column.notNull ? new GraphQLNonNull(type) : type,
          };
        }

        // Relations
        const relations = Object.entries(table.relations);
        for (const [relationName, relation] of relations) {
          const referencedTable = tables.find(
            (table) => table.dbName === relation.referencedTableName,
          );
          if (!referencedTable)
            throw new Error(
              `Internal error: Referenced table "${relation.referencedTableName}" not found`,
            );

          const referencedEntityType = entityTypes[referencedTable.tsName];
          const referencedEntityPageType = entityPageTypes[referencedTable.tsName];
          const referencedEntityFilterType = entityFilterTypes[referencedTable.tsName];
          if (
            referencedEntityType === undefined ||
            referencedEntityPageType === undefined ||
            referencedEntityFilterType === undefined
          )
            throw new Error(
              `Internal error: Referenced entity types not found for table "${referencedTable.tsName}" `,
            );

          if (is(relation, One)) {
            const fields = relation.config?.fields ?? [];
            const references = relation.config?.references ?? [];

            if (fields.length !== references.length) {
              throw new Error(
                "Internal error: Fields and references arrays must be the same length",
              );
            }

            fieldConfigMap[relationName] = {
              // Note: There is a `relation.isNullable` field here but it appears
              // to be internal / incorrect. Until we have support for foriegn
              // key constraints, all `one` relations must be nullable.
              type: referencedEntityType,
              resolve: (parent, _args, context) => {
                const loader = context.getDataLoader({ table: referencedTable });

                const rowFragment: Record<string, unknown> = {};
                for (let i = 0; i < references.length; i++) {
                  const referenceColumn = references[i]!;
                  const fieldColumn = fields[i]!;

                  const fieldColumnTsName = getColumnTsName(fieldColumn);
                  const referenceColumnTsName = getColumnTsName(referenceColumn);

                  rowFragment[referenceColumnTsName] = parent[fieldColumnTsName];
                }

                const encodedId = encodeRowFragment(rowFragment);
                return loader.load(encodedId);
              },
            };
          } else if (is(relation, Many)) {
            // Search the relations of the referenced table for the corresponding `one` relation.
            // If "relationName" is not provided, use the first `one` relation that references this table.
            const oneRelation = Object.values(referencedTable.relations).find(
              (relation) =>
                relation.relationName === relationName ||
                (is(relation, One) && relation.referencedTableName === table.dbName),
            ) as One | undefined;
            if (!oneRelation)
              throw new Error(
                `Internal error: Relation "${relationName}" not found in table "${referencedTable.tsName}"`,
              );

            const fields = oneRelation.config?.fields ?? [];
            const references = oneRelation.config?.references ?? [];

            const referencedEntityOrderByType = entityOrderByEnums[referencedTable.tsName];
            if (!referencedEntityOrderByType)
              throw new Error(`Entity_orderBy Enum not found for ${referencedTable.tsName}`);

            fieldConfigMap[relationName] = {
              type: referencedEntityPageType,
              args: {
                where: { type: referencedEntityFilterType },
                orderBy: { type: referencedEntityOrderByType },
                orderDirection: { type: OrderDirectionEnum },
                first: { type: GraphQLInt },
                skip: { type: GraphQLInt },
              },
              resolve: (parent, args: PluralArgs, context, info) => {
                const relationalConditions = [] as (SQL | undefined)[];
                for (let i = 0; i < references.length; i++) {
                  const column = fields[i]!;
                  const value = parent[references[i]!.name];
                  relationalConditions.push(eq(column, value));
                }

                return executePluralQuery(
                  referencedTable,
                  schema[referencedTable.tsName] as PgTable,
                  context.drizzle,
                  args,
                  relationalConditions,
                );
              },
            };
          } else {
            throw new Error(
              `Internal error: Relation "${relationName}" is unsupported, expected One or Many`,
            );
          }
        }

        // Polymorphic Plural Entity Fields
        // NOTE: overrides any automatic field definitions from the above
        polymorphicFields
          // filter by fields on this type
          .filter(([[parent]]) => parent === entityTypeName)
          // define each polymorphic plural field
          .forEach(([[, fieldName], interfaceTypeName]) => {
            fieldConfigMap[fieldName] = definePolymorphicPluralField({
              schema,
              interfaceType: interfaceTypes[interfaceTypeName]!,
              filterType: entityFilterTypes[interfaceTypeName]!,
              orderByType: entityOrderByEnums[interfaceTypeName]!,
              intersectionTableConfig: tablesConfig.tables[interfaceTypeName]!,
              implementingTableConfigs: polymorphicTableConfigs[interfaceTypeName]!,
            });
          });

        return fieldConfigMap;
      },
    });

    entityPageTypes[table.tsName] = new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(entityTypes[table.tsName]!)),
    );
  }

  const queryFields: Record<string, GraphQLFieldConfig<Parent, Context>> = {};
  for (const table of tables) {
    // skip making top level query fields for our fake intersection tables
    if (isInterfaceType(polymorphicConfig, table.tsName)) continue;

    const entityType = entityTypes[table.tsName]!;
    const entityPageType = entityPageTypes[table.tsName]!;
    const entityFilterType = entityFilterTypes[table.tsName]!;

    const singularFieldName = table.tsName.charAt(0).toLowerCase() + table.tsName.slice(1);
    const pluralFieldName = `${singularFieldName}s`;

    queryFields[singularFieldName] = {
      type: entityType,
      // Find the primary key columns and GraphQL core types and include them
      // as arguments to the singular query type.
      args: Object.fromEntries(
        table.primaryKey.map((column) => [
          getColumnTsName(column),
          {
            type: new GraphQLNonNull(columnToGraphQLCore(column, enumTypes) as GraphQLInputType),
          },
        ]),
      ),
      resolve: async (_parent, args, context) => {
        const loader = context.getDataLoader({ table });

        // The `args` object here should be a valid `where` argument that
        // uses the `eq` shorthand for each primary key column.
        const encodedId = encodeRowFragment(args);
        return loader.load(encodedId);
      },
    };

    const entityOrderByType = entityOrderByEnums[table.tsName];
    if (!entityOrderByType) throw new Error(`Entity_orderBy Enum not found for ${table.tsName}`);

    queryFields[pluralFieldName] = {
      type: entityPageType,
      args: {
        where: { type: entityFilterType },
        orderBy: { type: entityOrderByType },
        orderDirection: { type: OrderDirectionEnum },
        first: { type: GraphQLInt },
        skip: { type: GraphQLInt },
      },
      resolve: async (_parent, args: PluralArgs, context, info) => {
        return executePluralQuery(table, schema[table.tsName] as PgTable, context.drizzle, args);
      },
    };
  }

  // Polymorphic Plural Query Fields
  // NOTE: overrides any automatic field definitions from the above
  polymorphicFields
    // filter by fieldPaths that have a parent of Query
    .filter(([[parent]]) => parent === "Query")
    // build each polymorphic plural field
    .forEach(([[, fieldName], interfaceTypeName]) => {
      queryFields[fieldName] = definePolymorphicPluralField({
        schema,
        interfaceType: interfaceTypes[interfaceTypeName]!,
        filterType: entityFilterTypes[interfaceTypeName]!,
        orderByType: entityOrderByEnums[interfaceTypeName]!,
        intersectionTableConfig: tablesConfig.tables[interfaceTypeName]!,
        implementingTableConfigs: polymorphicTableConfigs[interfaceTypeName]!,
      });
    });

  // Subgraph Meta Field
  queryFields._meta = {
    type: new GraphQLObjectType({
      name: "_Meta_",
      fields: {
        block: {
          type: new GraphQLNonNull(
            new GraphQLObjectType({
              name: "_Block_",
              description: "Information about a specific block.",
              fields: {
                hash: { type: GraphQLString },
                number: { type: new GraphQLNonNull(GraphQLInt) },
                timestamp: { type: new GraphQLNonNull(GraphQLInt) },
                parentHash: { type: GraphQLString },
              },
            }),
          ),
        },
        deployment: {
          type: new GraphQLNonNull(GraphQLString),
          description:
            "An ID representing this instance of ENSNode. It is composed of the ENSNode version (https://github.com/namehash/ensnode/releases) and the Ponder build_id (https://ponder.sh/docs/api-reference/database#instance-lifecycle).",
        },
        hasIndexingErrors: {
          type: new GraphQLNonNull(GraphQLBoolean),
          description:
            "If true, ENSIndexer has reported an indexing error and is not actively indexing blocks.",
        },
      },
    }),
    resolve: async (_source, _args) => {
      try {
        const [lastIndexedBlock, hasIndexingErrors, ponderBuildId] = await Promise.all([
          metadataProvider.getLastIndexedDeploymentChainBlock(),
          metadataProvider.hasIndexingErrors(),
          metadataProvider.getPonderBuildId(),
        ]);

        return {
          deployment: `${metadataProvider.version}-${ponderBuildId}`,
          hasIndexingErrors,
          block: {
            number: Number(lastIndexedBlock.number),
            timestamp: Number(lastIndexedBlock.timestamp),
            hash: lastIndexedBlock.hash,
            parentHash: lastIndexedBlock.parentHash,
          },
        };
      } catch (error) {
        console.error("Cannot build subgraph _Meta_", error);
        return null;
      }
    },
  };

  return new GraphQLSchema({
    // Include these here so they are listed first in the printed schema.
    types: [GraphQLJSON, GraphQLBigInt, GraphQLPageInfo],
    query: new GraphQLObjectType({
      name: "Query",
      fields: queryFields,
    }),
  });
}

const GraphQLPageInfo = new GraphQLObjectType({
  name: "PageInfo",
  fields: {
    hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString },
  },
});

const GraphQLBigInt = new GraphQLScalarType({
  name: "BigInt",
  serialize: (value) => String(value),
  parseValue: (value) => BigInt(value as any),
  parseLiteral: (value) => {
    if (value.kind === "StringValue") {
      return BigInt(value.value);
    } else {
      throw new Error(
        `Invalid value kind provided for field of type BigInt: ${value.kind}. Expected: StringValue`,
      );
    }
  },
});

const columnToGraphQLCore = (
  column: Column,
  enumTypes: Record<string, GraphQLEnumType>,
): GraphQLOutputType => {
  if (column.columnType === "PgEvmBigint") {
    return GraphQLBigInt;
  }

  if (column instanceof PgEnumColumn) {
    if (column.enum === undefined) {
      throw new Error(
        `Internal error: Expected enum column "${getColumnTsName(column)}" to have an "enum" property`,
      );
    }
    const enumType = enumTypes[column.enum.enumName];
    if (enumType === undefined) {
      throw new Error(
        `Internal error: Expected to find a GraphQL enum named "${column.enum.enumName}"`,
      );
    }

    return enumType;
  }

  switch (column.dataType) {
    case "boolean":
      return GraphQLBoolean;
    case "json":
      return GraphQLJSON;
    case "date":
      return GraphQLString;
    case "string":
      return GraphQLString;
    case "bigint":
      return GraphQLString;
    case "number":
      return is(column, PgInteger) || is(column, PgSerial) ? GraphQLInt : GraphQLFloat;
    case "buffer":
      return new GraphQLList(new GraphQLNonNull(GraphQLInt));
    case "array": {
      if (column.columnType === "PgVector") {
        return new GraphQLList(new GraphQLNonNull(GraphQLFloat));
      }

      if (column.columnType === "PgGeometry") {
        return new GraphQLList(new GraphQLNonNull(GraphQLFloat));
      }

      const innerType = columnToGraphQLCore((column as any).baseColumn, enumTypes);

      return new GraphQLList(new GraphQLNonNull(innerType));
    }
    default:
      throw new Error(`Type ${column.dataType} is not implemented`);
  }
};

const innerType = (type: GraphQLOutputType): GraphQLScalarType | GraphQLEnumType => {
  if (type instanceof GraphQLScalarType || type instanceof GraphQLEnumType) return type;
  if (type instanceof GraphQLList || type instanceof GraphQLNonNull) return innerType(type.ofType);
  throw new Error(`Type ${type.toString()} is not implemented`);
};

async function executePluralQuery(
  table: TableRelationalConfig,
  from: PgTable | Subquery | PgViewBase | SQL,
  drizzle: Drizzle<any>,
  args: PluralArgs,
  extraConditions: (SQL | undefined)[] = [],
) {
  const limit = args.first ?? DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) {
    throw new Error(`Invalid limit. Got ${limit}, expected <=${MAX_LIMIT}.`);
  }

  const skip = args.skip ?? 0;

  const orderBySchema = buildOrderBySchema(table, args);
  const orderBy = orderBySchema.map(([columnName, direction]) => {
    const column = table.columns[columnName];
    if (column === undefined) {
      throw new Error(`Unknown column "${columnName}" used in orderBy argument`);
    }

    return direction === "asc" ? asc(column) : desc(column);
  });

  const whereConditions = buildWhereConditions(args.where, table);

  const query = drizzle
    .select()
    .from(from)
    .where(and(...whereConditions, ...extraConditions))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(skip);

  const startTime = performance.now();

  // actually execute the query
  const rows = await query;

  const queryDurationSeconds = (performance.now() - startTime) / 1000;
  const isSlowQuery = queryDurationSeconds > 2;
  if (isSlowQuery) {
    console.warn(`Slow Query Detected (${queryDurationSeconds.toFixed(4)}s)`);
    console.warn(new PgDialect().sqlToQuery(query.getSQL()).sql);
    console.log("\n");
  }

  return rows;
}

const conditionSuffixes = {
  universal: ["", "_not"],
  singular: ["_in", "_not_in"],
  plural: ["_has", "_not_has"],
  numeric: ["_gt", "_lt", "_gte", "_lte"],
  string: [
    "_contains",
    "_not_contains",
    "_starts_with",
    "_ends_with",
    "_not_starts_with",
    "_not_ends_with",
  ],
} as const;

const conditionSuffixesByLengthDesc = Object.values(conditionSuffixes)
  .flat()
  .sort((a, b) => b.length - a.length);

function buildWhereConditions(
  where: Record<string, any> | undefined,
  table: TableRelationalConfig,
): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];

  if (where === undefined) return conditions;

  for (const [whereKey, rawValue] of Object.entries(where)) {
    // Handle the `AND` and `OR` operators
    if (whereKey === "and" || whereKey === "or") {
      if (!Array.isArray(rawValue)) {
        throw new Error(
          `Invalid query: Expected an array for the ${whereKey} operator. Got: ${rawValue}`,
        );
      }

      const nestedConditions = rawValue.flatMap((subWhere) =>
        buildWhereConditions(subWhere, table),
      );

      if (nestedConditions.length > 0) {
        conditions.push(whereKey === "and" ? and(...nestedConditions) : or(...nestedConditions));
      }
      continue;
    }

    // Search for a valid filter suffix, traversing the list from longest to shortest
    // to avoid ambiguity between cases like `_not_in` and `_in`.
    const conditionSuffix = conditionSuffixesByLengthDesc.find((s) => whereKey.endsWith(s));
    if (conditionSuffix === undefined) {
      throw new Error(`Invariant violation: Condition suffix not found for where key ${whereKey}`);
    }

    // Remove the condition suffix and use the remaining string as the column name.
    const columnName = whereKey.slice(0, whereKey.length - conditionSuffix.length);

    const column =
      columnName in table.relations
        ? // if the referenced name is a relation, the relevant column is this table's `${relationName}Id`
          table.columns[`${columnName}Id`]
        : // otherwise validate that the column name is present in the table
          table.columns[columnName];

    if (column === undefined) {
      throw new Error(`Invalid query: Where clause contains unknown column ${columnName}`);
    }

    switch (conditionSuffix) {
      case "":
        if (column.columnType === "PgArray") {
          conditions.push(and(arrayContains(column, rawValue), arrayContained(column, rawValue)));
        } else {
          if (rawValue === null) {
            conditions.push(isNull(column));
          } else {
            conditions.push(eq(column, rawValue));
          }
        }
        break;
      case "_not":
        if (column.columnType === "PgArray") {
          conditions.push(
            not(and(arrayContains(column, rawValue), arrayContained(column, rawValue))!),
          );
        } else {
          if (rawValue === null) {
            conditions.push(isNotNull(column));
          } else {
            conditions.push(ne(column, rawValue));
          }
        }
        break;
      case "_in":
        conditions.push(inArray(column, rawValue));
        break;
      case "_not_in":
        conditions.push(notInArray(column, rawValue));
        break;
      case "_has":
        conditions.push(arrayContains(column, [rawValue]));
        break;
      case "_not_has":
        conditions.push(not(arrayContains(column, [rawValue])));
        break;
      case "_gt":
        conditions.push(gt(column, rawValue));
        break;
      case "_lt":
        conditions.push(lt(column, rawValue));
        break;
      case "_gte":
        conditions.push(gte(column, rawValue));
        break;
      case "_lte":
        conditions.push(lte(column, rawValue));
        break;
      case "_contains":
        conditions.push(like(column, `%${rawValue}%`));
        break;
      case "_not_contains":
        conditions.push(notLike(column, `%${rawValue}%`));
        break;
      case "_starts_with":
        conditions.push(like(column, `${rawValue}%`));
        break;
      case "_ends_with":
        conditions.push(like(column, `%${rawValue}`));
        break;
      case "_not_starts_with":
        conditions.push(notLike(column, `${rawValue}%`));
        break;
      case "_not_ends_with":
        conditions.push(notLike(column, `%${rawValue}`));
        break;
      default:
        throw new Error(`Invalid Condition Suffix ${conditionSuffix}`);
    }
  }

  return conditions;
}

function buildOrderBySchema(table: TableRelationalConfig, args: PluralArgs) {
  // If the user-provided order by does not include the ALL of the ID columns,
  // add any missing ID columns to the end of the order by clause (asc).
  // This ensures a consistent sort order to unblock cursor pagination.
  const userDirection = args.orderDirection ?? "asc";
  const userColumns: [string, "asc" | "desc"][] =
    args.orderBy !== undefined ? [[args.orderBy, userDirection]] : [];
  const pkColumns = table.primaryKey.map((column) => [getColumnTsName(column), userDirection]);
  const missingPkColumns = pkColumns.filter(
    (pkColumn) => !userColumns.some((userColumn) => userColumn[0] === pkColumn[0]),
  ) as [string, "asc" | "desc"][];
  return [...userColumns, ...missingPkColumns];
}

export function buildDataLoaderCache({ drizzle }: { drizzle: Drizzle<Schema> }) {
  const dataLoaderMap = new Map<TableRelationalConfig, DataLoader<string, any> | undefined>();
  return ({ table }: { table: TableRelationalConfig }) => {
    const baseQuery = (drizzle as Drizzle<{ [key: string]: OnchainTable }>).query[table.tsName];
    if (baseQuery === undefined)
      throw new Error(`Internal error: Unknown table "${table.tsName}" in data loader cache`);

    let dataLoader = dataLoaderMap.get(table);
    if (dataLoader === undefined) {
      dataLoader = new DataLoader(
        async (encodedIds) => {
          const decodedRowFragments = encodedIds.map(decodeRowFragment);

          // The decoded row fragments should be valid `where` objects
          // which use the `eq` object shorthand for each primary key column.
          const idConditions = decodedRowFragments.map((decodedRowFragment) =>
            and(...buildWhereConditions(decodedRowFragment, table)),
          );

          const rows = await baseQuery.findMany({
            where: or(...idConditions),
            limit: encodedIds.length,
          });

          // Now, we need to order the rows coming out of the database to match
          // the order of the IDs passed in. To accomplish this, we need to do
          // a comparison of the decoded row PK fragments with the database rows.
          // This is tricky because the decoded row PK fragments are not normalized,
          // so some comparisons will fail (eg for our PgHex column type).
          // To fix this, we need to normalize the values before doing the comparison.
          return (
            decodedRowFragments
              // Normalize the decoded row fragments
              // .map((fragment) =>
              //   Object.fromEntries(
              //     Object.entries(fragment).map(([col, val]) => {
              //       const column = table.columns[col];
              //       if (column === undefined) {
              //         throw new Error(
              //           `Unknown column '${table.tsName}.${col}' used in dataloader row ID fragment`,
              //         );
              //       }
              //       return [col, normalizeColumn(column, val, false)];
              //     }),
              //   ),
              // )
              // Find the database row corresponding to each normalized row fragment
              .map((fragment) =>
                rows.find((row) =>
                  Object.entries(fragment).every(([col, val]) => row[col] === val),
                ),
              )
          );
        },
        { maxBatchSize: 1_000 },
      );
      dataLoaderMap.set(table, dataLoader);
    }

    return dataLoader;
  };
}

function getColumnTsName(column: Column) {
  const tableColumns = getTableColumns(column.table);
  return Object.entries(tableColumns).find(([_, c]) => c.name === column.name)![0];
}

function encodeRowFragment(rowFragment: { [k: string]: unknown }): string {
  return Buffer.from(serialize(rowFragment)).toString("base64");
}

function decodeRowFragment(encodedRowFragment: string): {
  [k: string]: unknown;
} {
  return deserialize(Buffer.from(encodedRowFragment, "base64").toString());
}

// the subgraph's GraphQL types are just the capitalized version of ponder's tsName
function getSubgraphEntityName(tsName: string) {
  return capitalize(tsName);
}

function isInterfaceType(polymorphicConfig: PolymorphicConfig, columnName: string) {
  return columnName in polymorphicConfig.types;
}

// defines a table and relations that is the intersection of the provided `tableConfigs`
function getIntersectionTableSchema(
  interfaceTypeName: string,
  tableConfigs: TableRelationalConfig[],
) {
  if (tableConfigs.length === 0) throw new Error("Must have some tables to intersect");

  const baseColumns = tableConfigs[0]!.columns;
  const baseRelations = tableConfigs[0]!.relations;

  // compute the common columnNames
  const commonColumnNames = intersectionOf(
    tableConfigs.map((table) => Object.keys(table.columns)), //
  );

  // compute the common relationshipNames
  const commonRelationsNames = intersectionOf(
    tableConfigs.map((table) => Object.keys(table.relations)),
  );

  // define a pgTable by cloning the common columns w/ builder functions
  // TODO: can we more easily clone theses instead of using builder fns? Object.assign?
  // NOTE: it's important that this table's dbName is intersection_table, as that is what the
  //   UNION ALL subquery is aliased to later
  // TODO: can we use drizzle's .with or something to avoid the magic string?
  const intersectionTable = pgTable("intersection_table", (t) => {
    function getColumnBuilder(column: Column) {
      const sqlType = column.getSQLType();

      // special case for bigint which returns "numeric(78)"
      if (sqlType === "numeric(78)") {
        return t.numeric({ precision: 78 });
      }

      // handle standard types, removing any parameters from the SQLType
      // @ts-expect-error we know it is a valid key now
      const built = t[sqlType.split("(")[0]]();

      // include .primaryKey if necessary
      return column.primary ? built.primaryKey() : built;
    }

    const columnMap: Record<string, PgColumnBuilderBase> = {};

    for (const columnName of commonColumnNames) {
      const baseColumn = baseColumns[columnName]!;
      columnMap[columnName] = getColumnBuilder(baseColumn).notNull(baseColumn.notNull);
    }

    return columnMap;
  });

  // define the relationships for this table by cloning the common relationships
  const intersectionTableRelations = relations(intersectionTable, ({ one }) =>
    commonRelationsNames.reduce<Record<string, Relation<any>>>((memo, relationName) => {
      const relation = baseRelations[relationName];

      if (is(relation, One)) {
        memo[relationName] = one(relation.referencedTable, relation.config as any);
      } else if (is(relation, Many)) {
        // NOTE: unimplemented — only One relations are necessary for relationalConditions later
      }

      return memo;
    }, {}),
  );

  return {
    [interfaceTypeName]: intersectionTable,
    [`${interfaceTypeName}Relations`]: intersectionTableRelations,
  };
}

// produces Record<string, Column> that is the union of all columns in tables
function getColumnsUnion(tables: TableRelationalConfig[]): Record<string, Column> {
  return tables.reduce(
    (memo, table) => ({
      ...memo,
      ...table.columns,
    }),
    {},
  );
}

// builds a drizzle subquery from the set of provided tables with given `where` filter
function buildUnionAllQuery(
  drizzle: Drizzle<{ [key: string]: OnchainTable }>,
  schema: Schema,
  tables: TableRelationalConfig[],
  where: Record<string, unknown> = {},
) {
  const allColumns = getColumnsUnion(tables);
  const allColumnNames = Object.keys(allColumns).sort();

  // builds a subquery per-table like `SELECT columns... from :table (WHERE fk = fkv)`
  const subqueries = tables.map((table) => {
    // NOTE: every subquery of union must have the same columns of the same types so we
    // build select object with nulls for missing columns, manually casting them to the correct type
    const selectAllColumnsIncludingNulls = allColumnNames.reduce((memo, columnName) => {
      const column = allColumns[columnName]!;
      const dbColumnName = table.columns[columnName]
        ? toSnakeCase(table.columns[columnName].name)
        : "NULL";

      return {
        ...memo,
        [columnName]: sql.raw(`${dbColumnName}::${column.getSQLType()}`).as(column.name),
      };
    }, {});

    // apply the relation filter at subquery level to minimize merged data
    // NOTE: that we use this table's Column so the generated sql references the correct table
    const relationalConditions: SQL[] = Object.entries(where).map(
      ([foreignKeyName, foreignKeyValue]) => eq(table.columns[foreignKeyName]!, foreignKeyValue),
    );

    return drizzle
      .select({
        ...selectAllColumnsIncludingNulls,
        // inject __typename into each subquery
        __typename: sql.raw(`'${getSubgraphEntityName(table.tsName)}'`).as("__typename"),
      })
      .from(schema[table.tsName] as PgTable)
      .where(and(...relationalConditions))
      .$dynamic();
  });

  // joins the subqueries with UNION ALL and aliases it to `intersection_table`
  return subqueries
    .reduce((memo, fragment, i) => (i === 0 ? fragment : memo.unionAll(fragment)))
    .as("intersection_table");
}

/**
 * creates the GraphQLFieldConfig for a polymorphic plural field
 *
 * @param schema the database schema containing table definitions
 * @param interfaceType the GraphQL interface type for the polymorphic field
 * @param filterType the GraphQL input type for filtering records
 * @param orderByType the GraphQL enum type for ordering records
 * @param intersectionTableConfig the TableConfig representing the intersection
 *        of `implementingTableConfigs`
 * @param implementingTableConfigs array of table configs that implement the interface
 */
function definePolymorphicPluralField({
  schema,
  interfaceType,
  filterType,
  orderByType,
  intersectionTableConfig,
  implementingTableConfigs,
}: {
  schema: Schema;
  interfaceType: GraphQLInterfaceType;
  filterType: GraphQLInputObjectType;
  orderByType: GraphQLEnumType;
  intersectionTableConfig: TableRelationalConfig;
  implementingTableConfigs: TableRelationalConfig[];
}): GraphQLFieldConfig<Parent, Context> {
  return {
    type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(interfaceType))),
    args: {
      where: { type: filterType },
      orderBy: { type: orderByType },
      orderDirection: { type: OrderDirectionEnum },
      first: { type: GraphQLInt },
      skip: { type: GraphQLInt },
    },
    resolve: async (parent, args: PluralArgs, { drizzle }, info) => {
      // find the relation field that references the parent type
      const foreignKeyName = getForeignKeyFieldName(intersectionTableConfig, info.parentType.name);

      // include it in the relationalFilter iff necessary
      const relationalFilter = foreignKeyName ? { [foreignKeyName]: parent.id } : {};

      // construct a UNION ALL subquery
      const subquery = buildUnionAllQuery(
        drizzle,
        schema,
        implementingTableConfigs,
        relationalFilter,
      );

      // pass it to executePluralQuery as usual
      return executePluralQuery(intersectionTableConfig, subquery, drizzle, args);
    },
  };
}

// finds the foreign key name in a table that references a given GraphQL parentTypeName
function getForeignKeyFieldName(table: TableRelationalConfig, parentTypeName: string) {
  // 1. find the first relation field that references the parent type name
  const relationName = Object.keys(table.relations).find(
    (relationName) => getSubgraphEntityName(relationName) === parentTypeName,
  );
  if (!relationName) return;

  // ignore if this isn't a One relation
  const relation = table.relations[relationName];
  if (!is(relation, One)) return;

  // 2. find the columnName of the correct column
  const fkEntry = Object.entries(relation.config?.fields?.[0]?.table ?? {}).find(
    ([_, column]) => column.name === relation.config?.fields?.[0]?.name,
  );

  // 3. columnName is the name of the foreign key column in `table`
  return fkEntry?.[0];
}
