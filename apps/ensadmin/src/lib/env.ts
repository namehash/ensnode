/**
 * Get ENSAdmin service public URL.
 *
 * Note: using Vercel platform for ENSAdmin deployments works best when
 * this function returns undefined and lets default values to be applied.
 * Read more: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#default-value
 */
export function ensAdminPublicUrl(): string | undefined {
  const envVarName = "ENSADMIN_PUBLIC_URL";
  const envVarValue = process.env.ENSADMIN_PUBLIC_URL;

  if (!envVarValue) {
    return undefined;
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
