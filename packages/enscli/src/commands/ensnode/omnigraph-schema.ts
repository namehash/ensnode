import {
  getOmnigraphSchema,
  lookupOmnigraphSchema,
  type OmnigraphSchemaFieldInfo,
} from "@ensnode/ensnode-sdk/internal";

import { printResult } from "../../lib/output";

function renderField(field: OmnigraphSchemaFieldInfo, indent: string): string {
  const args = field.args ? `(${field.args.map((a) => `${a.name}: ${a.type}`).join(", ")})` : "";
  const description = field.description
    ? `\n${indent}  # ${field.description.replace(/\s+/g, " ").trim()}`
    : "";
  return `${indent}${field.name}${args}: ${field.type}${description}`;
}

function renderTypePretty(type: {
  description: string | null;
  kind: string;
  name: string;
  fields?: OmnigraphSchemaFieldInfo[];
  values?: Array<{ name: string }>;
  types?: string[];
}): string {
  const lines: string[] = [];
  if (type.description) lines.push(`# ${type.description.replace(/\s+/g, " ").trim()}`);
  lines.push(`${type.kind} ${type.name} {`);
  if (type.fields) for (const field of type.fields) lines.push(renderField(field, "  "));
  else if (type.values) for (const value of type.values) lines.push(`  ${value.name}`);
  else if (type.types) lines.push(`  ${type.types.join(" | ")}`);
  lines.push("}");
  return lines.join("\n");
}

function renderRootPretty(root: { query: OmnigraphSchemaFieldInfo[]; types: string[] }): string {
  return [
    "# Root query fields",
    ...root.query.map((field) => renderField(field, "  ")),
    "",
    "# Types (use `schema <Type>` for details)",
    ...root.types.map((name) => `  ${name}`),
  ].join("\n");
}

function renderFieldPathPretty(field: OmnigraphSchemaFieldInfo & { parent: string }): string {
  return `${field.parent}.${renderField(field, "")}`;
}

function renderSearchPretty(result: { types: string[]; fields: string[] }): string {
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
  if (typeof args.search === "string") {
    const result = lookupOmnigraphSchema({ search: args.search }) as {
      types: string[];
      fields: string[];
    };
    printResult(result, args, renderSearchPretty);
    return;
  }

  if (!target) {
    const result = lookupOmnigraphSchema({}) as {
      query: OmnigraphSchemaFieldInfo[];
      types: string[];
    };
    printResult(result, args, renderRootPretty);
    return;
  }

  if (target.includes(".")) {
    printResult(
      lookupOmnigraphSchema({ type: target }) as OmnigraphSchemaFieldInfo & { parent: string },
      args,
      renderFieldPathPretty,
    );
    return;
  }

  const type = getOmnigraphSchema().getType(target);
  if (!type) {
    throw new Error(
      `Unknown type "${target}". Run "enscli ensnode omnigraph schema" to list types, or use --search.`,
    );
  }
  printResult(
    lookupOmnigraphSchema({ type: target }) as {
      description: string | null;
      kind: string;
      name: string;
      fields?: OmnigraphSchemaFieldInfo[];
      values?: Array<{ name: string }>;
      types?: string[];
    },
    args,
    renderTypePretty,
  );
}
