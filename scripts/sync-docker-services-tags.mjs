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

async function getVersionFromEnsapi() {
  const ensapiPackageJsonPath = resolve(rootDir, "apps/ensapi/package.json");
  const packageJsonContent = await readFile(ensapiPackageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent);

  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error("Could not read version from apps/ensapi/package.json");
  }

  return packageJson.version;
}

function validateVersion(version) {
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid version "${version}". Expected SemVer-like value such as 1.10.1`);
  }
}

async function updateServiceDefaultTag(version) {
  const testPattern = /\$\{ENSNODE_TAG:-[^}]+\}/;
  const replacePattern = /\$\{ENSNODE_TAG:-[^}]+\}/g;
  const replacement = `\${ENSNODE_TAG:-${version}}`;

  for (const relativePath of serviceFiles) {
    const absolutePath = resolve(rootDir, relativePath);
    const content = await readFile(absolutePath, "utf8");

    if (!testPattern.test(content)) {
      throw new Error(`Could not find ENSNODE_TAG default expression in ${relativePath}`);
    }

    const updated = content.replace(replacePattern, replacement);
    await writeFile(absolutePath, updated, "utf8");
    console.log(`Updated ${relativePath} -> ${version}`);
  }
}

async function main() {
  const versionFromArg = process.argv[2];
  const version = versionFromArg ?? (await getVersionFromEnsapi());

  validateVersion(version);
  await updateServiceDefaultTag(version);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
