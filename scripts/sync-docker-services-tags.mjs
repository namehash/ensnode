import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");

const serviceFiles = [
  "docker/services/ensadmin.yml",
  "docker/services/ensapi.yml",
  "docker/services/ensindexer.yml",
  "docker/services/ensrainbow.yml",
];

const semverRegex = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function validateVersion(version) {
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid version "${version}". Expected SemVer-like value such as 1.10.1`);
  }
}

async function updateServiceDefaultTag(version) {
  const testPattern = /\$\{ENSNODE_VERSION:-[^}]+\}/;
  const replacePattern = /\$\{ENSNODE_VERSION:-[^}]+\}/g;
  const replacement = `\${ENSNODE_VERSION:-${version}}`;

  console.log(`Updating service default tag to ${version}\n`);

  for (const relativePath of serviceFiles) {
    const absolutePath = resolve(rootDir, relativePath);
    const content = await readFile(absolutePath, "utf8");

    if (!testPattern.test(content)) {
      throw new Error(`Could not find ENSNODE_VERSION default expression in ${relativePath}`);
    }

    const previous = content.match(testPattern)[0];
    const updated = content.replace(replacePattern, replacement);
    await writeFile(absolutePath, updated, "utf8");
    console.log(`Updated ${relativePath}:\t"${previous}" -> "${replacement}"`);
  }
}

async function main() {
  const versionFromArg = process.argv[2];
  if (typeof versionFromArg !== "string" || versionFromArg.length === 0) {
    throw new Error(
      "Version argument is required. Usage: node scripts/sync-docker-services-tags.mjs <version>",
    );
  }

  validateVersion(versionFromArg);
  await updateServiceDefaultTag(versionFromArg);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
