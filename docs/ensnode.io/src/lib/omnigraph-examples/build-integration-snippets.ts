import { ACTIVE_OMNIGRAPH_VERSION } from "@data/omnigraph-examples/active";
import { ENSNODE_URL } from "@lib/playground/constants";

/** Package managers shown in Setup tabs (npm default). */
export type SetupPackageManager = "npm" | "pnpm";

export const SETUP_PACKAGE_MANAGERS: SetupPackageManager[] = ["npm", "pnpm"];

const npmSdkVersion = ACTIVE_OMNIGRAPH_VERSION.replace(/^v/, "");

/** Setup steps for enssdk per package manager: scaffold, install, copy snippet, run. */
export function buildEnssdkSetupSnippets(): Record<SetupPackageManager, string> {
  const deps = `enssdk@${npmSdkVersion}`;
  const devDeps = "tsx typescript @types/node";
  const pasteStep = "# 3. Paste the TypeScript snippet above into src/index.ts";
  const runEnv = `ENSNODE_URL=${ENSNODE_URL}`;

  return {
    npm: `# 1. Create project
mkdir -p my-ens-script/src && cd my-ens-script
npm init -y && touch src/index.ts
npm pkg set type=module scripts.start="tsx src/index.ts"
# 2. Install dependencies
npm install ${deps} && npm install -D ${devDeps}
${pasteStep}
# 4. Run
${runEnv} npm start`,

    pnpm: `# 1. Create project
mkdir -p my-ens-script/src && cd my-ens-script
pnpm init && touch src/index.ts
pnpm pkg set type=module scripts.start="tsx src/index.ts"
# 2. Install dependencies
pnpm add ${deps} && pnpm add -D ${devDeps}
${pasteStep}
# 4. Run
${runEnv} pnpm start`,
  };
}

/** Setup steps for enskit per package manager: scaffold, install, copy snippet, run. */
export function buildEnskitSetupSnippets(): Record<SetupPackageManager, string> {
  const deps = `enskit@${npmSdkVersion} enssdk@${npmSdkVersion}`;
  const viteFlags = "--template react-ts --no-interactive --no-immediate";
  const pasteStep = "# 3. Copy the TSX snippet above into src/App.tsx";
  const runEnv = `VITE_ENSNODE_URL=${ENSNODE_URL}`;

  return {
    npm: `# 1. Create project
npm create vite@latest my-ens-app -- ${viteFlags}
cd my-ens-app
# 2. Install dependencies
npm install
npm install ${deps}
${pasteStep}
# 4. Run
${runEnv} npm run dev`,

    pnpm: `# 1. Create project
pnpm create vite@latest my-ens-app ${viteFlags}
cd my-ens-app
# 2. Install dependencies
pnpm install
pnpm add ${deps}
${pasteStep}
# 4. Run
${runEnv} pnpm run dev`,
  };
}

/** Strip GraphQL `#` line comments so operation parsing ignores comment text like `your query here`. */
export function stripGraphQLLineComments(query: string): string {
  return query.replace(/^\s*#.*$/gm, "");
}

/** Parse the operation name from a GraphQL query string (e.g. `query RegistryDomains` → `"RegistryDomains"`). */
export function extractGraphQLOperationName(query: string): string {
  const match = stripGraphQLLineComments(query).match(/(?:query|mutation|subscription)\s+(\w+)/);
  return match?.[1] ?? "Query";
}

/**
 * Parse variable name → type from a GraphQL operation signature.
 * e.g. `query Foo($name: InterpretedName!, $limit: Int)` → `{ name: "InterpretedName!", limit: "Int" }`
 */
export function parseGraphQLVariableTypes(query: string): Record<string, string> {
  const sigMatch = stripGraphQLLineComments(query).match(
    /(?:query|mutation|subscription)\s+\w+\s*\(([^)]+)\)/,
  );
  if (!sigMatch) return {};
  const types: Record<string, string> = {};
  for (const part of sigMatch[1].split(",")) {
    const m = part.trim().match(/^\$(\w+)\s*:\s*(.+)$/);
    if (m) types[m[1]] = m[2].trim();
  }
  return types;
}

function hasInterpretedNameVars(types: Record<string, string>): boolean {
  return Object.values(types).some((t) => t.replace("!", "") === "InterpretedName");
}

/**
 * Emit a TypeScript object literal for the given variables, wrapping `InterpretedName` values
 * with `asInterpretedName("…")`.
 */
export function formatVariablesForTypeScript(
  variables: Record<string, unknown>,
  types: Record<string, string>,
): string {
  if (Object.keys(variables).length === 0) return "{}";
  const entries = Object.entries(variables).map(([key, val]) => {
    const baseType = (types[key] ?? "").replace("!", "");
    if (baseType === "InterpretedName" && typeof val === "string") {
      return `  ${key}: asInterpretedName(${JSON.stringify(val)})`;
    }
    const serialized = JSON.stringify(val, null, 2).replace(/\n/g, "\n  ");
    return `  ${key}: ${serialized}`;
  });
  return `{\n${entries.join(",\n")},\n}`;
}

function indentGraphqlQuery(query: string): string {
  return query
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function indentVariablesBlock(varsLiteral: string, indent: string): string {
  return varsLiteral.replace(/\n/g, `\n${indent}`);
}

/** Build a runnable enssdk TypeScript snippet for the given query and variables. */
export function buildEnssdkSnippet(params: {
  query: string;
  variables: Record<string, unknown>;
}): string {
  const { query, variables } = params;
  const opName = extractGraphQLOperationName(query);
  const types = parseGraphQLVariableTypes(query);
  const needsInterpretedName = hasInterpretedNameVars(types);
  const hasVars = Object.keys(variables).length > 0;
  const varsLiteral = formatVariablesForTypeScript(variables, types);
  const indentedQuery = indentGraphqlQuery(query);
  const variablesBlock = hasVars ? indentVariablesBlock(varsLiteral, "  ") : "{}";
  const interpretedNameImport = needsInterpretedName
    ? 'import { asInterpretedName } from "enssdk";\n'
    : "";

  return `import { createEnsNodeClient } from "enssdk/core";
${interpretedNameImport}import { graphql, omnigraph } from "enssdk/omnigraph";

const client = createEnsNodeClient({ 
  url: process.env.ENSNODE_URL || "${ENSNODE_URL}"
}).extend(omnigraph);

const ${opName}Query = graphql(\`
${indentedQuery}
\`);

const result = await client.omnigraph.query({
  query: ${opName}Query,
  variables: ${variablesBlock},
});

if (result.errors) throw new Error(JSON.stringify(result.errors));
console.log(JSON.stringify(result.data, null, 2));`;
}

/** Build a minimal React component snippet using enskit for the given query and variables. */
export function buildEnskitSnippet(params: {
  query: string;
  variables: Record<string, unknown>;
}): string {
  const { query, variables } = params;
  const opName = extractGraphQLOperationName(query);
  const types = parseGraphQLVariableTypes(query);
  const needsInterpretedName = hasInterpretedNameVars(types);
  const hasVars = Object.keys(variables).length > 0;
  const varsLiteral = formatVariablesForTypeScript(variables, types);
  const indentedQuery = indentGraphqlQuery(query);
  const variablesBlock = hasVars ? indentVariablesBlock(varsLiteral, "    ") : "{}";
  const interpretedNameImport = needsInterpretedName
    ? 'import { asInterpretedName } from "enssdk";\n'
    : "";

  return `import { OmnigraphProvider, useOmnigraphQuery, graphql } from "enskit/react/omnigraph";
import { createEnsNodeClient } from "enssdk/core";
${interpretedNameImport}import { omnigraph } from "enssdk/omnigraph";

const client = createEnsNodeClient({
  url: import.meta.env.VITE_ENSNODE_URL || "${ENSNODE_URL}"
}).extend(omnigraph);

const ${opName}Query = graphql(\`
${indentedQuery}
\`);

function ${opName}Result() {
  const [result] = useOmnigraphQuery({
    query: ${opName}Query,
    variables: ${variablesBlock},
  });
  const { data, fetching, error } = result;
  if (!data && fetching) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>No data returned.</p>;
  const formatted = JSON.stringify(
    data,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
  return <code>{formatted}</code>;
}

export default function App() {
  return (
    <OmnigraphProvider client={client}>
      <${opName}Result />
    </OmnigraphProvider>
  );
}`;
}
