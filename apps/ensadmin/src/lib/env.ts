import { uniq } from "@ensnode/ensnode-sdk";

import { buildHttpHostname, buildHttpHostnames, type HttpHostname } from "./url-utils";

const isValidRuntimeEnvironmentVariables = (
  variables: unknown,
): variables is Record<string, unknown> => {
  // check variables is non-null object...
  if (variables === null) return false;
  if (typeof variables !== "object") return false;

  return true;
};

const getRuntimeEnvVariable = (key: string): string | undefined => {
  if (typeof window == "undefined") return undefined;

  const variables = (window as any).__ENSADMIN_RUNTIME_ENVIRONMENT_VARIABLES as unknown;
  console.log("getRuntimeEnvVariable variables", variables);
  if (!isValidRuntimeEnvironmentVariables(variables)) {
    console.log("getRuntimeEnvVariable: invalid variables");
    return undefined;
  }

  const value = variables[key];
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  if (value === "") return undefined; // empty-string to undefined

  return value;
};

/**
 * Retrieves an env variable from either runtime variables, if specified, or process.env (build-time).
 * @param key The key of the environment variable
 * @returns The value, if specified, or undefined.
 */
const getEnvVariable = (key: string): string | undefined => {
  return getRuntimeEnvVariable(key) ?? process.env[key];
};

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
  const envVarValue = getEnvVariable(envVarName);

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
  const port = getEnvVariable("PORT") || DEFAULT_ENSADMIN_PORT;

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
  return getEnvVariable("VERCEL") === "1";
}

/**
 * Builds a public URL of the app assuming it runs on Vercel.
 *
 * @returns public URL of the app if it is running on Vercel, else `null`
 * @throws when app is on the Vercel platform but the `HttpHostname` could not be formed.
 */
function getVercelAppPublicUrl(): HttpHostname | null {
  if (!isAppOnVercelPlatform()) return null;

  const vercelEnv = getEnvVariable("VERCEL_ENV");
  let vercelAppHostname: string | undefined;

  switch (vercelEnv) {
    case "production":
      vercelAppHostname = getEnvVariable("VERCEL_PROJECT_PRODUCTION_URL");
    case "development":
    case "preview":
      vercelAppHostname = getEnvVariable("VERCEL_BRANCH_URL") || getEnvVariable("VERCEL_URL");
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
  const envVarValue =
    getEnvVariable("NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY") || DEFAULT_SERVER_CONNECTION_LIBRARY;

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
