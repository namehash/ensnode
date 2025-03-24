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

/**
 * Get URL of currently selected ENSNode instance.
 * @param params
 * @returns URL from `ensnode` search param or the first URL from default URLs list
 */
export function selectedEnsNodeUrl(params: URLSearchParams): URL {
  const ensnode = params.get("ensnode");

  if (!ensnode) {
    return defaultEnsNodeUrls()[0];
  }

  return new URL(ensnode);
}

const DEFAULT_ENSNODE_URL = "https://api.alpha.ensnode.io";

/**
 * Get list of URLs for default ENSNode instances.
 *
 * @returns a list (with at least one element) of URLs for default ENSNode instances
 */
export function defaultEnsNodeUrls(): Array<URL> {
  const envVarName = "NEXT_PUBLIC_DEFAULT_ENSNODE_URLS";
  const envVarValue = process.env.NEXT_PUBLIC_DEFAULT_ENSNODE_URLS;

  if (!envVarValue) {
    console.warn(
      `No default ENSNode URL provided in "${envVarName}". Using fallback: ${DEFAULT_ENSNODE_URL}`,
    );

    return [new URL(DEFAULT_ENSNODE_URL)];
  }

  try {
    const urlList = envVarValue.split(",").map((maybeUrl) => parseUrl(maybeUrl));

    if (urlList.length === 0) {
      throw new Error(`At least one valid URL must be set to "${envVarName}"`);
    }

    return urlList;
  } catch (error) {
    console.error(error);

    throw new Error(`Invalid ${envVarName} value "${envVarValue}". It should be a valid URL.`);
  }
}

/**
 * Get the first URL from a list of URLs for default ENSNode instances.
 * @returns URL for default ENSNode instance
 */
export function defaultEnsNodeUrl(): URL {
  return defaultEnsNodeUrls()[0];
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
