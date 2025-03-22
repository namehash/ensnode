/**
 * Get ENSAdmin service public URL.
 */
export function ensAdminPublicUrl() {
  const envVarName = "ENSADMIN_PUBLIC_URL";
  const envVarValue = process.env[envVarName];
  
  if (!envVarValue) {
    throw new Error(`Required "${envVarName}" value was not set`);
  }

  try {
    return parseUrl(envVarValue).toString();
  } catch (error) {
    console.error(error);

    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

export function selectedEnsNodeUrl(params: URLSearchParams): string {
  return new URL(params.get("ensnode") || preferredEnsNodeUrl()).toString();
}

const PREFERRED_ENSNODE_URL = "https://alpha.ensnode.io";

export function preferredEnsNodeUrl(): string {
  const envVarName = "NEXT_PUBLIC_PREFERRED_ENSNODE_URL";
  const envVarValue = process.env.NEXT_PUBLIC_PREFERRED_ENSNODE_URL;

  if (!envVarValue) {
    console.warn(
      `No preferred URL provided in "${envVarName}". Using fallback: ${PREFERRED_ENSNODE_URL}`,
    );

    return PREFERRED_ENSNODE_URL;
  }

  try {
    return parseUrl(envVarValue).toString();
  } catch (error) {
    console.error(error);

    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

function parseUrl(maybeUrl: string): URL {
  try {
    return new URL(maybeUrl);
  } catch (error) {
    throw new Error(`Invalid URL: ${maybeUrl}`);
  }
}

export async function ensAdminVersion(): Promise<string> {
  return import("../../package.json").then(({ version }) => version);
}
