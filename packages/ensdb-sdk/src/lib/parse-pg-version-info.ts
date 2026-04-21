/**
 * Parse PostgreSQL version information from a version string.
 *
 * @param versionString  The version string is expected to be in the format
 *                       returned by the PostgreSQL `version()` function,
 *                       which typically looks like:
 *                       "PostgreSQL 15.5 (Ubuntu 15.5-0ubuntu0.22.04.1) ..."
 * @returns The parsed PostgreSQL version as a string.
 */
export function parsePgVersionInfo(versionString: string | undefined): string {
  if (typeof versionString !== "string") {
    throw new Error("PostgreSQL version string must be a string");
  }

  // extract the version number using regex
  const match = versionString.match(/PostgreSQL (\d+\.\d+)/);

  if (!match) {
    throw new Error(`Failed to parse PostgreSQL version from version string: '${versionString}'`);
  }

  const parsedVersion = match[1];

  if (typeof parsedVersion !== "string") {
    throw new Error(`Parsed PostgreSQL version is not a string: '${parsedVersion}'`);
  }

  return parsedVersion;
}
