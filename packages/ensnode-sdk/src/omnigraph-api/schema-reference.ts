import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import {
  buildSchema,
  type GraphQLArgument,
  type GraphQLField,
  type GraphQLInputField,
  type GraphQLNamedType,
  type GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isUnionType,
} from "graphql";

const require = createRequire(import.meta.url);

/** Types rendered with full field listings in the condensed schema reference. */
export const OMNIGRAPH_CORE_TYPES = [
  "Domain",
  "DomainCanonical",
  "Account",
  "Resolver",
  "DomainResolver",
  "Registry",
  "Permissions",
  "ReverseResolve",
  "ForwardResolve",
  "ResolvedRecords",
  "PrimaryNameRecord",
] as const;

let cachedSchema: GraphQLSchema | undefined;

/** Loads the Omnigraph schema from the SDL bundled with enssdk (no network). */
export function getOmnigraphSchema(): GraphQLSchema {
  cachedSchema ??= buildSchema(
    readFileSync(require.resolve("enssdk/omnigraph/schema.graphql"), "utf8"),
  );
  return cachedSchema;
}

interface ArgInfo {
  name: string;
  type: string;
  description: string | null;
}

interface FieldInfo {
  name: string;
  type: string;
  description: string | null;
  args?: ArgInfo[];
}

function oneLine(description: string | null | undefined): string {
  return description ? description.replace(/\s+/g, " ").trim() : "";
}

function argInfo(arg: GraphQLArgument): ArgInfo {
  return { name: arg.name, type: arg.type.toString(), description: arg.description ?? null };
}

function fieldInfo(field: GraphQLField<unknown, unknown> | GraphQLInputField): FieldInfo {
  const args = "args" in field && field.args.length > 0 ? field.args.map(argInfo) : undefined;
  return {
    name: field.name,
    type: field.type.toString(),
    description: field.description ?? null,
    ...(args ? { args } : {}),
  };
}

function renderFieldLine(field: GraphQLField<unknown, unknown>): string {
  const args =
    field.args.length > 0 ? `(${field.args.map((a) => `${a.name}: ${a.type}`).join(", ")})` : "";
  const description = oneLine(field.description);
  return `- ${field.name}${args}: ${field.type}${description ? ` — ${description}` : ""}`;
}

function renderTypeMarkdown(type: GraphQLNamedType): string {
  if (!isObjectType(type) && !isInterfaceType(type)) return "";
  const lines = [`#### ${type.name}`];
  if (type.description) lines.push(`_${oneLine(type.description)}_`);
  for (const field of Object.values(type.getFields())) lines.push(renderFieldLine(field));
  return lines.join("\n");
}

function describeType(type: GraphQLNamedType) {
  const base = { name: type.name, description: type.description ?? null };
  if (isObjectType(type) || isInterfaceType(type)) {
    return {
      ...base,
      kind: isObjectType(type) ? "object" : "interface",
      fields: Object.values(type.getFields()).map(fieldInfo),
    };
  }
  if (isInputObjectType(type)) {
    return { ...base, kind: "input", fields: Object.values(type.getFields()).map(fieldInfo) };
  }
  if (isEnumType(type)) {
    return {
      ...base,
      kind: "enum",
      values: type.getValues().map((value) => ({
        name: value.name,
        description: value.description ?? null,
      })),
    };
  }
  if (isUnionType(type)) {
    return { ...base, kind: "union", types: type.getTypes().map((member) => member.name) };
  }
  return { ...base, kind: "scalar" };
}

function describeRoot(schema: GraphQLSchema) {
  const queryType = schema.getQueryType();
  const queryFields = queryType ? Object.values(queryType.getFields()).map(fieldInfo) : [];
  const types = listMajorTypeNames(schema);
  return { query: queryFields, types };
}

function listMajorTypeNames(schema: GraphQLSchema): string[] {
  const queryType = schema.getQueryType();
  return Object.values(schema.getTypeMap())
    .filter((type) => isObjectType(type) && !type.name.startsWith("__"))
    .map((type) => type.name)
    .filter(
      (name) =>
        name !== queryType?.name &&
        !name.endsWith("Connection") &&
        !name.endsWith("ConnectionEdge") &&
        !name.endsWith("Edge") &&
        !name.endsWith("Payload"),
    )
    .sort();
}

function describeFieldPath(schema: GraphQLSchema, typeName: string, fieldName: string) {
  const type = schema.getType(typeName);
  if (!type || !(isObjectType(type) || isInterfaceType(type) || isInputObjectType(type))) {
    throw new Error(`Type "${typeName}" has no fields.`);
  }
  const field = type.getFields()[fieldName];
  if (!field) {
    throw new Error(`Type "${typeName}" has no field "${fieldName}".`);
  }
  return { parent: typeName, ...fieldInfo(field) };
}

function searchSchema(schema: GraphQLSchema, keyword: string) {
  const query = keyword.toLowerCase();
  const types: string[] = [];
  const fields: string[] = [];
  for (const type of Object.values(schema.getTypeMap())) {
    if (type.name.startsWith("__")) continue;
    if (type.name.toLowerCase().includes(query)) types.push(type.name);
    if (isObjectType(type) || isInterfaceType(type) || isInputObjectType(type)) {
      for (const field of Object.values(type.getFields())) {
        if (field.name.toLowerCase().includes(query)) fields.push(`${type.name}.${field.name}`);
      }
    }
  }
  return { search: keyword, types: types.sort(), fields: fields.sort() };
}

export type OmnigraphSchemaLookupInput = {
  type?: string;
  search?: string;
};

/** Looks up Omnigraph schema fields locally. Returns JSON-serializable data. */
export function lookupOmnigraphSchema(input: OmnigraphSchemaLookupInput): unknown {
  const schema = getOmnigraphSchema();

  if (input.search) {
    return searchSchema(schema, input.search);
  }

  if (input.type?.includes(".")) {
    const [typeName, fieldName] = input.type.split(".", 2);
    if (!typeName || !fieldName) {
      throw new Error('Invalid `type` — expected "Type.field" (e.g. Account.resolve).');
    }
    return describeFieldPath(schema, typeName, fieldName);
  }

  if (input.type) {
    const type = schema.getType(input.type);
    if (!type) {
      throw new Error(`Unknown type "${input.type}".`);
    }
    return describeType(type);
  }

  return describeRoot(schema);
}

/** Condensed Omnigraph schema reference for agent skills and MCP resources. */
export function buildCondensedSchemaReference(
  schema: GraphQLSchema = getOmnigraphSchema(),
): string {
  const queryType = schema.getQueryType();
  const sections: string[] = [];

  if (queryType) {
    const queryFields = Object.values(queryType.getFields()).map(renderFieldLine);
    sections.push(["### Query (entry points)", ...queryFields].join("\n"));
  }

  const coreSections: string[] = [];
  for (const name of OMNIGRAPH_CORE_TYPES) {
    const type = schema.getType(name);
    if (type) {
      const rendered = renderTypeMarkdown(type);
      if (rendered) coreSections.push(rendered);
    }
  }
  sections.push(["### Core types", coreSections.join("\n\n")].join("\n\n"));

  const otherTypes = listMajorTypeNames(schema).filter(
    (name) => !OMNIGRAPH_CORE_TYPES.includes(name as (typeof OMNIGRAPH_CORE_TYPES)[number]),
  );
  sections.push(
    [
      "### Other types",
      "Run `npx enscli ensnode omnigraph schema <Type>` for fields of:",
      "",
      otherTypes.map((name) => `\`${name}\``).join(", "),
    ].join("\n"),
  );

  return sections.join("\n\n");
}
