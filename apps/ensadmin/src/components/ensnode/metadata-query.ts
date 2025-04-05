import { ensAdminVersion } from "@/lib/env";
import DeploymentConfigs, {
  ENSDeploymentChain,
  ENSDeploymentConfig,
} from "@ensnode/ens-deployments";
import { queryOptions } from "@tanstack/react-query";
import { satisfies } from "semver";
import * as v from "valibot";
import type { EnsNode } from "./types";

/**
 * Create query options for the ENSNode metadata query.
 *
 * @param ensNodeUrl ENSNode URL
 * @returns Query options for the ENSNode metadata query.
 */
export function ensNodeMetadataQueryOptions(ensNodeUrl: URL) {
  return queryOptions({
    queryKey: ["ensnode", ensNodeUrl.toString(), "metadata"],
    queryFn: () => fetchEnsNodeMetadata(ensNodeUrl),
    throwOnError(error) {
      throw new Error(`ENSNode request error at '${ensNodeUrl}'. Cause: ${error.message}`);
    },
  });
}

/**
 * Fetches the ENSNode status.
 *
 * @param baseUrl ENSNode URL
 * @returns Information about the ENSNode runtime, environment, dependencies, and more.
 */
async function fetchEnsNodeMetadata(baseUrl: URL): Promise<EnsNode.Metadata> {
  const response = await fetch(new URL(`/metadata`, baseUrl), {
    headers: {
      "content-type": "application/json",
      "x-ensadmin-version": await ensAdminVersion(),
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch ENSNode status", response);
    throw new Error("Failed to fetch ENSNode status");
  }

  return validateResponse(await response.json());
}

/**
 * Checks if the response has the expected structure.
 * @param response
 * @throws Error if the response is invalid
 */
function validateResponse(response: unknown): EnsNode.Metadata {
  const SUPPORTED_ENSNODE_VERSION = ">=0.0.1";

  const supportedEnsDeploymentChains = Array.from(
    Object.keys(DeploymentConfigs),
  ) as Array<ENSDeploymentChain>;

  const EnsNodeBlockInfoSchema = v.object({
    number: v.number(),
    timestamp: v.number(),
  });

  const EnsNodeAppInfoSchema = v.object({
    name: v.pipe(
      v.string(),
      v.endsWith("ensindexer", "ENSNode application name must end with 'ensindexer'"),
    ),
    version: v.pipe(
      v.string(),
      v.check(
        (version) => satisfies(version, SUPPORTED_ENSNODE_VERSION),
        `ENSNode version must satisfy ${SUPPORTED_ENSNODE_VERSION}`,
      ),
    ),
  });

  const EnsNodeDepsSchema = v.object({
    ponder: v.string(),
    nodejs: v.string(),
  });

  const EnsNodeEnvSchema = v.object({
    ACTIVE_PLUGINS: v.pipe(
      v.string(),
      v.transform((activePlugins) => activePlugins.split(",") as Array<keyof ENSDeploymentConfig>),
    ),
    DATABASE_SCHEMA: v.string(),
    ENS_DEPLOYMENT_CHAIN: v.pipe(v.picklist(supportedEnsDeploymentChains)),
  });

  const EnsNodeNetworkIndexingStatusSchema = v.object({
    firstBlockToIndex: EnsNodeBlockInfoSchema,
    latestSafeBlock: EnsNodeBlockInfoSchema,
    lastIndexedBlock: v.nullable(EnsNodeBlockInfoSchema),
    lastSyncedBlock: v.nullable(EnsNodeBlockInfoSchema),
  });

  const EnsNodeRuntimeSchema = v.object({
    codebaseBuildId: v.string(),
    networkIndexingStatusByChainId: v.pipe(
      v.record(v.string(), EnsNodeNetworkIndexingStatusSchema),
    ),
  });

  const EnsNodeMetadataSchema = v.object({
    app: EnsNodeAppInfoSchema,
    deps: EnsNodeDepsSchema,
    env: EnsNodeEnvSchema,
    runtime: EnsNodeRuntimeSchema,
  });

  return v.parse(EnsNodeMetadataSchema, response) satisfies EnsNode.Metadata;
}
