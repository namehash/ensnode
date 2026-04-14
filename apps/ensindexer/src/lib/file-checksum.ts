// src/lib/checksum.ts

import { createHash } from "node:crypto";
import { resolve } from "node:path";

import ts from "typescript";

import { logger } from "@/lib/logger";

/**
 * Get a checksum representing a given entry point file.
 *
 * @param entryPoint The entry point file for which to compute the checksum.
 *                   This is a path relative to the ENSIndexer app directory (`apps/ensindexer`).
 * @param tsConfigPath The path to the TypeScript configuration file.
 * @returns The computed checksum as a string.
 *
 * @example
 * ```ts
 * // Compute checksums for the `apps/ensindexer/ponder/ponder.config.ts` file
 * const ponderConfigChecksum = fileChecksum("ponder/ponder.config.ts");
 * // Compute checksums for the `apps/ensindexer/ponder/ponder.schema.ts` file
 * const ponderSchemaChecksum = fileChecksum("ponder/ponder.schema.ts");
 * // Compute checksums for the `apps/ensindexer/ponder/src/register-handlers.ts` file
 * const ponderLogicChecksum = fileChecksum("ponder/src/register-handlers.ts");
 * ```
 */
export function fileChecksum(entryPoint: string, tsConfigPath: string = "tsconfig.json"): string {
  const root = process.cwd();
  const resolvedEntry = resolve(root, entryPoint);

  logger.info({
    msg: "Computing entrypoint checksum",
    entryPoint,
    resolvedEntry,
  });

  // Read tsconfig
  const tsConfigFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (tsConfigFile.error) {
    throw new Error(`Failed to read tsconfig: ${tsConfigPath}`);
  }

  const parsedTsConfig = ts.parseJsonConfigFileContent(
    tsConfigFile.config,
    ts.sys,
    root,
    undefined,
    tsConfigPath,
  );

  const tsProgram = ts.createProgram([resolvedEntry], parsedTsConfig.options);

  const allTsFiles = tsProgram
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile &&
        !sourceFile.fileName.includes("node_modules") &&
        !sourceFile.fileName.startsWith("\0"),
    )
    .map((sourceFile) => sourceFile.fileName);
  const tsSourceFiles = new Set<string>(allTsFiles);

  if (tsSourceFiles.size === 0) {
    throw new Error(`No source files found for entry point: ${entryPoint}`);
  } else {
    logger.info({
      msg: "Files included in logic checksum",
      entryPoint,
      filesCount: tsSourceFiles.size,
    });
  }

  const hash = createHash("sha256");

  for (const file of tsSourceFiles) {
    const content = ts.sys.readFile(file);
    if (content) hash.update(content);
  }

  const checksum = hash.digest("hex").slice(0, 16);

  logger.info({
    msg: "Logic checksum",
    entryPoint,
    checksum,
  });

  return checksum;
}
