import { uniq } from "@ensnode/ensnode-sdk";
import { type HttpHostname, buildHttpHostname, buildHttpHostnames } from "./url-utils";

/**
 * Get ENSAdmin service public HttpHostname.
 *
 * Note: a Vercel fallback HttpHostname will be used if application runs on Vercel platform.
 * If the Vercel fallback HttpHostname cannot be applied, then default HttpHostname will be used.
 *
 * @returns application public HttpHostname for ENSAdmin
 * @throws when Vercel platform was detected but could not determine HttpHostname
 */
export function ensAdminPublicUrl(): HttpHostname {
  const envVarName = "ENSADMIN_PUBLIC_URL";
  let envVarValue = process.env[envVarName];

  if (!envVarValue) {
    const vercelAppPublicUrl = getVercelAppPublicUrl();
    if (vercelAppPublicUrl) {
      return vercelAppPublicUrl;
    }

    return defaultEnsAdminPublicUrl();
  }

  const result = buildHttpHostname(envVarValue);
  if (!result.isValid) {
    throw new Error(
      `Invalid ${envVarName} value "${envVarValue}": Cannot build ENSAdmin public HttpHostname: ${result.error}`,
    );
  }
  return result.url;
}

const DEFAULT_ENSADMIN_PORT = 4173;

function defaultEnsAdminPublicUrl(): HttpHostname {
  const port = process.env.PORT || DEFAULT_ENSADMIN_PORT;

  const result = buildHttpHostname(`http://localhost:${port}`);
  if (!result.isValid) {
    throw new Error(
      `Invalid port "${port}". Cannot build default ENSAdmin public HttpHostname: ${result.error}`,
    );
  }
  return result.url;
}

/**
 * Tells if the application runs on Vercel.
 */
function isAppOnVercelPlatform(): boolean {
  return process.env.VERCEL === "1";
}

/**
 * Builds a public URL of the app assuming it runs on Vercel.
 *
 * @returns public URL of the app if it is running on Vercel, else `null`
 * @throws when app is on the Vercel platform but the `HttpHostname` could not be formed.
 */
function getVercelAppPublicUrl(): HttpHostname | null {
  if (!isAppOnVercelPlatform()) {
    return null;
  }

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

  const result = buildHttpHostname(`https://${vercelAppHostname}`);

  if (!result.isValid) {
    throw new Error(
      `Could not build Vercel app public URL for hostname "${vercelAppHostname}": ${result.error}`,
    );
  }

  return result.url;
}

const DEFAULT_SERVER_CONNECTION_LIBRARY =
  "https://api.alpha.ensnode.io,https://api.alpha-sepolia.ensnode.io,https://api.mainnet.ensnode.io,https://api.sepolia.ensnode.io,https://api.holesky.ensnode.io";

/**
 * Gets the server's ENSNode connection library.
 *
 * @returns a list 1 or more `HttpHostname` values.
 * @throws when no `HttpHostname` could be returned.
 */
export function getServerConnectionLibrary(): HttpHostname[] {
  const envVarName = "NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY";
  let envVarValue = process.env.NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY;

  if (!envVarValue) {
    console.warn(
      `No server connection library of ENSNode URLs provided in "${envVarName}". Using fallback: ${DEFAULT_SERVER_CONNECTION_LIBRARY}`,
    );

    envVarValue = DEFAULT_SERVER_CONNECTION_LIBRARY;
  }

  const connections = buildHttpHostnames(envVarValue.split(","));

  if (connections.length === 0) {
    throw new Error(
      `Invalid ${envVarName} value: "${envVarValue}" must contain at least one valid ENSNode connection URL`,
    );
  }

  // naive deduplication
  const uniqueConnections = uniq(connections);

  return uniqueConnections;
}

export async function ensAdminVersion(): Promise<string> {
  const packageJson = await import("@/../package.json");

  return packageJson.version;
}
