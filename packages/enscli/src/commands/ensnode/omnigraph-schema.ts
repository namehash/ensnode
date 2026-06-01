import schemaSDL from "enssdk/omnigraph/schema.graphql";
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

import { printResult } from "../../lib/output";

let cachedSchema: GraphQLSchema | null = null;

/** Builds the Omnigraph schema from the SDL bundled with enssdk (no network, always matches the SDK). */
function loadSchema(): GraphQLSchema {
  if (!cachedSchema) {
    cachedSchema = buildSchema(schemaSDL);
  }
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

/** Field/value listing for a single named type, abstracting over object/interface/input/enum/union. */
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

/** Root listing: query entrypoints plus the major (non-connection) types, abstracting Relay plumbing. */
function describeRoot(schema: GraphQLSchema) {
  const queryType = schema.getQueryType();
  const queryFields = queryType ? Object.values(queryType.getFields()).map(fieldInfo) : [];
  const types = Object.values(schema.getTypeMap())
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
  return { query: queryFields, types };
}

function describeFieldPath(schema: GraphQLSchema, typeName: string, fieldName: string) {
  const type = schema.getType(typeName);
  if (!type || !(isObjectType(type) || isInterfaceType(type) || isInputObjectType(type))) {
    throw new Error(
      `Type "${typeName}" has no fields. Run "enscli ensnode omnigraph schema" to list types.`,
    );
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
  return { types: types.sort(), fields: fields.sort() };
}

function renderField(field: FieldInfo, indent: string): string {
  const args = field.args ? `(${field.args.map((a) => `${a.name}: ${a.type}`).join(", ")})` : "";
  const description = field.description
    ? `\n${indent}  # ${field.description.replace(/\s+/g, " ").trim()}`
    : "";
  return `${indent}${field.name}${args}: ${field.type}${description}`;
}

function renderTypePretty(type: ReturnType<typeof describeType>): string {
  const lines: string[] = [];
  if (type.description) lines.push(`# ${type.description.replace(/\s+/g, " ").trim()}`);
  lines.push(`${type.kind} ${type.name} {`);
  if ("fields" in type) for (const field of type.fields) lines.push(renderField(field, "  "));
  else if ("values" in type) for (const value of type.values) lines.push(`  ${value.name}`);
  else if ("types" in type) lines.push(`  ${type.types.join(" | ")}`);
  lines.push("}");
  return lines.join("\n");
}

function renderRootPretty(root: ReturnType<typeof describeRoot>): string {
  return [
    "# Root query fields",
    ...root.query.map((field) => renderField(field, "  ")),
    "",
    "# Types (use `schema <Type>` for details)",
    ...root.types.map((name) => `  ${name}`),
  ].join("\n");
}

function renderFieldPathPretty(field: ReturnType<typeof describeFieldPath>): string {
  return `${field.parent}.${renderField(field, "")}`;
}

function renderSearchPretty(result: ReturnType<typeof searchSchema>): string {
  return [
    "# Matching types",
    ...result.types.map((name) => `  ${name}`),
    "",
    "# Matching fields",
    ...result.fields.map((name) => `  ${name}`),
  ].join("\n");
}

/**
 * Renders the Omnigraph schema for `enscli ensnode omnigraph schema [Type[.field]]`. Dispatches to
 * `--search`, a single field, a single type, or the root listing. `args` carries the output format.
 */
export function runOmnigraphSchema(
  args: Record<string, unknown>,
  target: string | undefined,
): void {
  const omnigraphSchema = loadSchema();

  if (typeof args.search === "string") {
    printResult(searchSchema(omnigraphSchema, args.search), args, renderSearchPretty);
    return;
  }

  if (!target) {
    printResult(describeRoot(omnigraphSchema), args, renderRootPretty);
    return;
  }

  if (target.includes(".")) {
    const [typeName, fieldName] = target.split(".", 2);
    printResult(
      describeFieldPath(omnigraphSchema, typeName, fieldName),
      args,
      renderFieldPathPretty,
    );
    return;
  }

  const type = omnigraphSchema.getType(target);
  if (!type) {
    throw new Error(
      `Unknown type "${target}". Run "enscli ensnode omnigraph schema" to list types, or use --search.`,
    );
  }
  printResult(describeType(type), args, renderTypePretty);
}
