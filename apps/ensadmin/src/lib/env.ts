/**
 * Get ENSAdmin service public URL.
 *
 * Note: a Vercel fallback URL will be used if application runs on Vercel platform.
 * If the Vercel fallback URL cannot be applied, then default URL will be used.
 *
 * @returns application public URL for ENSAdmin
 * @throws when Vercel platform was detected but could not determine application hostname
 */
export function ensAdminPublicUrl(): URL {
  const envVarName = "ENSADMIN_PUBLIC_URL";
  const envVarValue = process.env[envVarName];

  if (!envVarValue) {
    if (isAppOnVercelPlatform()) {
      // build public URL using the Vercel-specific way
      return getVercelAppPublicUrl();
    }

    // otherwise, use default public URL
    return defaultEnsAdminPublicUrl();
  }

  try {
    return parseUrl(envVarValue);
  } catch (error) {
    console.error(error);

    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

/** Build a default public URL for ENSAdmin */
function defaultEnsAdminPublicUrl(): URL {
  let applicationPort: number;

  try {
    applicationPort = parseApplicationPort(process.env.PORT);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`Error building default public URL for ENSAdmin: ${errorMessage}`);

    applicationPort = 4173;
  }

  return new URL(`http://localhost:${applicationPort}`);
}

function parseApplicationPort(rawValue?: string): number {
  if (!rawValue) {
    throw new Error("Expected value not set");
  }

  const parsedValue = parseInt(rawValue, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`'${rawValue}' is not a number`);
  }

  if (parsedValue <= 0) {
    throw new Error(`'${rawValue}' is not a natural number`);
  }

  return parsedValue;
}

/**
 * Tells if the application runs on Vercel.
 */
function isAppOnVercelPlatform(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Builds a public URL of the app assuming it runs on Vercel.
 * @returns public URL
 * @throws when application hostname could not be determined based on `VERCEL_*` env vars
 */
function getVercelAppPublicUrl(): URL {
  const vercelEnv = process.env.VERCEL_ENV;
  let vercelAppHostname: string | undefined;

  switch (vercelEnv) {
    case "production":
      vercelAppHostname = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    case "development":
    case "preview":
      vercelAppHostname = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL;
  }

  if (!vercelAppHostname) {
    throw new Error(`Could not extract Vercel hostname for Vercel env "${vercelEnv}"`);
  }

  return new URL(`https://${vercelAppHostname}`);
}

export function selectedEnsNodeUrl(params: URLSearchParams): string {
  return new URL(params.get("ensnode") || preferredEnsNodeUrl()).toString();
}

const PREFERRED_ENSNODE_URL = "https://alpha.dev.ensnode.io";

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
