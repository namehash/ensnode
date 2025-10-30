import { uniq } from "@ensnode/ensnode-sdk";

import { buildHttpHostname, buildHttpHostnames, type HttpHostname } from "./url-utils";

const DEFAULT_ENSADMIN_PORT = 4173;
const DEFAULT_SERVER_CONNECTION_LIBRARY = [
  "https://api.alpha.ensnode.io",
  "https://api.alpha-sepolia.ensnode.io",
  "https://api.mainnet.ensnode.io",
  "https://api.sepolia.ensnode.io",
  "https://api.holesky.ensnode.io",
].join(",");

/**
 * Determines whether `variables` is a non-null object and a valid Record<string, unknown>.
 */
const isValidRuntimeEnvVariables = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Retrieves an env variable from runtime variables, if specified.
 *
 * @param key The key of the environment variable
 * @returns The value, if specified, or undefined.
 */
const getRuntimeEnvVariable = (key: string): string | undefined => {
  if (typeof window == "undefined") return undefined;

  const variables = (window as any).__ENSADMIN_RUNTIME_ENVIRONMENT_VARIABLES as unknown;
  if (!isValidRuntimeEnvVariables(variables)) return undefined;

  const value = variables[key];
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value !== "string") return undefined;
  if (value === "") return undefined; // empty-string to undefined

  return value;
};

function localhostEnsAdminPublicUrl(): string {
  const port = import.meta.env.PORT || DEFAULT_ENSADMIN_PORT.toString();
  return `http://localhost:${port}`;
}

/**
 * Tells if the application runs on Vercel.
 */
function isAppOnVercelPlatform(): boolean {
  return import.meta.env.VERCEL === "1";
}

/**
 * Builds a public URL of the app assuming it runs on Vercel.
 *
 * @returns public URL of the app if it is running on Vercel, else `null`
 * @throws when app is on the Vercel platform but the `HttpHostname` could not be formed.
 */
function getVercelAppPublicUrl(): string | undefined {
  if (!isAppOnVercelPlatform()) return undefined;

  switch (import.meta.env.VERCEL_ENV) {
    case "production":
      return import.meta.env.VERCEL_PROJECT_PRODUCTION_URL;
    case "development":
    case "preview":
      return import.meta.env.VERCEL_BRANCH_URL || import.meta.env.VERCEL_URL;
  }
}

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
  const envVarValue =
    import.meta.env.ENSADMIN_PUBLIC_URL || getVercelAppPublicUrl() || localhostEnsAdminPublicUrl();

  const result = buildHttpHostname(envVarValue);
  if (!result.isValid) {
    throw new Error(
      `Invalid ENSADMIN_PUBLIC_URL value "${envVarValue}": Cannot build ENSAdmin public HttpHostname: ${result.error}`,
    );
  }
  return result.url;
}

/**
 * Gets the server's ENSNode connection library.
 *
 * @returns a list 1 or more `HttpHostname` values.
 * @throws when no `HttpHostname` could be returned.
 */
export function getServerConnectionLibrary(): HttpHostname[] {
  const envVarName = "VITE_SERVER_CONNECTION_LIBRARY";
  const envVarValue =
    getRuntimeEnvVariable("VITE_SERVER_CONNECTION_LIBRARY") ||
    import.meta.env.VITE_SERVER_CONNECTION_LIBRARY ||
    DEFAULT_SERVER_CONNECTION_LIBRARY;

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
