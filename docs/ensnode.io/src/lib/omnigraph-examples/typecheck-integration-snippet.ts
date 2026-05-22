import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const docsRoot = fileURLToPath(new URL("../../../", import.meta.url));
const enssdkRoot = fileURLToPath(new URL("../../../../packages/enssdk", import.meta.url));
const enssdkSchemaPath = join(enssdkRoot, "src/omnigraph/generated/schema.graphql");
const enssdkIntrospectionPath = join(enssdkRoot, "src/omnigraph/generated/introspection.ts");

const snippetTypecheckCacheRoot = join(docsRoot, "node_modules/.cache/snippet-typecheck");

const preambles = {
  enssdk: `/// <reference types="node" />\n\n`,
  enskit: `/// <reference types="node" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_ENSNODE_URL: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
export {};

`,
} as const;

export type IntegrationSnippetKind = keyof typeof preambles;

function getSnippetCompilerOptions(kind: IntegrationSnippetKind): ts.CompilerOptions {
  const configPath = join(docsRoot, "tsconfig.json");
  const read = ts.readConfigFile(configPath, ts.sys.readFile);
  if (read.error) {
    throw new Error(ts.formatDiagnostic(read.error, ts.createCompilerHost({})));
  }
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, docsRoot);
  const gqlTadaPlugin = {
    name: "gql.tada/ts-plugin",
    schema: enssdkSchemaPath,
    tadaOutputLocation: enssdkIntrospectionPath,
  };

  return {
    ...parsed.options,
    noEmit: true,
    jsx: kind === "enskit" ? ts.JsxEmit.ReactJSX : parsed.options.jsx,
    plugins: [gqlTadaPlugin],
  } as ts.CompilerOptions;
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  if (diagnostic.file && diagnostic.start !== undefined) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const location = `${line + 1}:${character + 1}`;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    return `${location}: ${message}`;
  }
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
}

/** Return TypeScript errors for a generated integration snippet (empty if it typechecks). */
export function getIntegrationSnippetTypeErrors(
  snippet: string,
  kind: IntegrationSnippetKind,
): string[] {
  mkdirSync(snippetTypecheckCacheRoot, { recursive: true });
  const dir = mkdtempSync(join(snippetTypecheckCacheRoot, `${kind}-`));
  const fileName = kind === "enskit" ? "snippet.tsx" : "snippet.ts";
  const filePath = join(dir, fileName);

  try {
    const fullSnippet = preambles[kind] + snippet;
    writeFileSync(filePath, fullSnippet);
    const program = ts.createProgram([filePath], getSnippetCompilerOptions(kind));
    return ts.getPreEmitDiagnostics(program).map(formatDiagnostic);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Fail the test runner when the snippet does not typecheck. */
export function expectIntegrationSnippetTypechecks(
  snippet: string,
  kind: IntegrationSnippetKind,
): void {
  const errors = getIntegrationSnippetTypeErrors(snippet, kind);
  if (errors.length > 0) {
    throw new Error(
      `Expected ${kind} integration snippet to typecheck.\n\n${errors.join("\n")}\n\n--- snippet ---\n${snippet}`,
    );
  }
}
