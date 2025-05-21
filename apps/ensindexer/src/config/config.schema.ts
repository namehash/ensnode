import { parse as parseConnectionString } from "pg-connection-string";
import { z } from "zod/v4";

import { uniq } from "@/lib/lib-helpers";
import { PLUGIN_REQUIRED_DATASOURCES } from "@/plugins";
import { DatasourceName, ENSDeployments, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/utils";
import { Address, isAddress } from "viem";

export const DEFAULT_RPC_RATE_LIMIT = 50;
export const DEFAULT_ENSADMIN_URL = "https://admin.ensnode.io";
export const DEFAULT_PORT = 42069;
export const DEFAULT_HEAL_REVERSE_ADDRESSES = true;
export const DEFAULT_DEPLOYMENT = "mainnet";

const parseBlockNumber = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

const parseRpcUrl = () =>
  z.url({
    error:
      "RPC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseRpcMaxRequestsPerSecond = () =>
  z.coerce
    .number({ error: "RPC max requests per second must be an integer." })
    .int({ error: "RPC max requests per second must be an integer." })
    .min(1, { error: "RPC max requests per second must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT);

const parseChainConfig = () =>
  z.object({
    url: parseRpcUrl(),
    maxRequestsPerSecond: parseRpcMaxRequestsPerSecond(),
  });

const parseEnsDeploymentChain = () =>
  z
    .enum(Object.keys(ENSDeployments) as [keyof typeof ENSDeployments], {
      error: (issue) => {
        return `Invalid ENS_DEPLOYMENT_CHAIN. Supported ENS deployment chains are: ${Object.keys(
          ENSDeployments,
        ).join(", ")}`;
      },
    })
    .default(DEFAULT_DEPLOYMENT);

const parseBlockrange = () =>
  z
    .object({
      startBlock: parseBlockNumber("START_BLOCK"),
      endBlock: parseBlockNumber("END_BLOCK"),
    })
    .refine(
      (val) =>
        val.startBlock === undefined ||
        val.endBlock === undefined ||
        val.startBlock <= val.endBlock,
      { error: "END_BLOCK must be greater than or equal to START_BLOCK." },
    );

const parseEnsNodePublicUrl = () =>
  z.url({
    error:
      "ENSNODE_PUBLIC_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseEnsAdminUrl = () =>
  z
    .url({
      error:
        "ENSADMIN_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
    })
    .default(DEFAULT_ENSADMIN_URL);

const parsePonderDatabaseSchema = () =>
  z
    .string({
      error: "DATABASE_SCHEMA is required.",
    })
    .trim()
    .min(1, {
      error: "DATABASE_SCHEMA is required and cannot be an empty string.",
    });

const parsePlugins = () =>
  z.coerce
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .pipe(
      z
        .array(
          z.enum(PluginName, {
            error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
              PluginName,
            ).join(", ")}`,
          }),
        )
        .min(1, {
          error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
            PluginName,
          ).join(", ")}`,
        }),
    )
    .refine((arr) => arr.length === uniq(arr).length, {
      error: "ACTIVE_PLUGINS cannot contain duplicate values",
    });

const parseHealReverseAddresses = () =>
  z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: "HEAL_REVERSE_ADDRESSES must be 'true' or 'false'.",
      }),
    )
    .transform((val) => val === "true")
    .default(DEFAULT_HEAL_REVERSE_ADDRESSES);

const parsePort = () =>
  z.coerce
    .number({ error: "PORT must be an integer." })
    .int({ error: "PORT must be an integer." })
    .min(1, { error: "PORT must be an integer between 1 and 65535." })
    .max(65535, { error: "PORT must be an integer between 1 and 65535." })
    .default(DEFAULT_PORT);

const parseEnsRainbowEndpointUrl = () =>
  z.url({
    error:
      "ENSRAINBOW_URL must be a valid URL string (e.g., http://localhost:8080 or https://example.com).",
  });

const parseRpcConfigs = () =>
  z.record(z.string().transform(Number), parseChainConfig(), {
    error: "Chains configuration must be an object mapping numeric chain IDs to their configs.",
  });

const parseDatabaseUrl = () =>
  z.union(
    [
      z.string().refine((url) => {
        try {
          if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
            return false;
          }
          const config = parseConnectionString(url);
          return !!(config.host && config.port && config.database);
        } catch {
          return false;
        }
      }),
      z.undefined(),
    ],
    {
      message:
        "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
    },
  );

export const ENSIndexerConfigSchema = z
  .object({
    ensDeploymentChain: parseEnsDeploymentChain(),
    globalBlockrange: parseBlockrange(),
    ensNodePublicUrl: parseEnsNodePublicUrl(),
    ensAdminUrl: parseEnsAdminUrl(),
    ponderDatabaseSchema: parsePonderDatabaseSchema(),
    plugins: parsePlugins(),
    healReverseAddresses: parseHealReverseAddresses(),
    port: parsePort(),
    ensRainbowEndpointUrl: parseEnsRainbowEndpointUrl(),
    rpcConfigs: parseRpcConfigs(),
    databaseUrl: parseDatabaseUrl(),
  })
  // Invariant: specified plugins' datasources are available in the specified ensDeploymentChain's ENSDeployment
  .check((ctx) => {
    const { value: config } = ctx;

    const deployment = getENSDeployment(config.ensDeploymentChain);
    const allPluginNames = Object.keys(PLUGIN_REQUIRED_DATASOURCES) as PluginName[];
    const availableDatasourceNames = Object.keys(deployment) as DatasourceName[];
    const activePluginNames = allPluginNames.filter((pluginName) =>
      config.plugins.includes(pluginName),
    );

    // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
    for (const pluginName of activePluginNames) {
      const requiredDatasources = PLUGIN_REQUIRED_DATASOURCES[pluginName];
      const hasRequiredDatasources = requiredDatasources.every((datasourceName) =>
        availableDatasourceNames.includes(datasourceName),
      );

      if (!hasRequiredDatasources) {
        ctx.issues.push({
          code: "custom",
          input: config,
          message: `Requested plugin '${pluginName}' cannot be activated for the ${
            config.ensDeploymentChain
          } deployment. ${pluginName} specifies dependent datasources: [${requiredDatasources.join(
            ", ",
          )}], but available datasources in the ${
            config.ensDeploymentChain
          } deployment are: [${availableDatasourceNames.join(", ")}].`,
        });
      }
    }
  })
  // Invariant: rpcConfig is specified for each indexed chain
  .check((ctx) => {
    const { value: config } = ctx;

    const deployment = getENSDeployment(config.ensDeploymentChain);

    for (const pluginName of config.plugins) {
      const datasourceNames = PLUGIN_REQUIRED_DATASOURCES[pluginName];

      for (const datasourceName of datasourceNames) {
        const { chain } = deployment[datasourceName];

        if (!config.rpcConfigs[chain.id]) {
          ctx.issues.push({
            code: "custom",
            input: config,
            message: `Plugin '${pluginName}' indexes chain with id ${chain.id} but RPC_URL_${chain.id} is not specified.`,
          });
        }
      }
    }
  })
  // Invariant: if a global blockrange is defined, only one network is indexed
  .check((ctx) => {
    const { value: config } = ctx;
    const { globalBlockrange } = config;

    if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
      const deployment = getENSDeployment(config.ensDeploymentChain);
      const indexedChainIds = uniq(
        config.plugins
          .flatMap((pluginName) => PLUGIN_REQUIRED_DATASOURCES[pluginName])
          .map((datasourceName) => deployment[datasourceName])
          .map((datasource) => datasource.chain.id),
      );

      if (indexedChainIds.length > 1) {
        ctx.issues.push({
          code: "custom",
          input: config,
          message: `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains. The config currently is:

  ENS_DEPLOYMENT_CHAIN=${config.ensDeploymentChain}
  ACTIVE_PLUGINS=${config.plugins.join(",")}
  START_BLOCK=${globalBlockrange.startBlock || "n/a"}
  END_BLOCK=${globalBlockrange.endBlock || "n/a"}

  The usage you're most likely interested in is:
    ENS_DEPLOYMENT_CHAIN=(mainnet|sepolia|holesky) ACTIVE_PLUGINS=subgraph END_BLOCK=x pnpm run start
  which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

  In the future, indexing multiple networks with network-specific blockrange constraints may be possible.`,
        });
      }
    }
  })
  // Invariant: if ens-test-env is the ensDeploymentChain, ensure that its Datasources provide addresses
  .check((ctx) => {
    const { value: config } = ctx;

    const deployment = getENSDeployment(config.ensDeploymentChain);
    for (const datasourceName of Object.keys(deployment) as DatasourceName[]) {
      const { contracts } = deployment[datasourceName];

      // invariant: `contracts` must provide valid addresses if a filter is not provided
      const hasAddresses = Object.values(contracts)
        .filter((contractConfig) => "address" in contractConfig) // only ContractConfigs with `address` defined
        .every((contractConfig) => isAddress(contractConfig.address as Address)); // must be a valid `Address`

      if (!hasAddresses) {
        throw new Error(
          `The ENSDeployment '${
            config.ensDeploymentChain
          }' datasource '${datasourceName}' does not define valid addresses. This occurs if the address property of any ContractConfig in the ENSDeployment is malformed (i.e. not an Address). This is only likely to occur if you are running the 'ens-test-env' ENSDeployment outside of the context of the ens-test-env tool (https://github.com/ensdomains/ens-test-env). If you are activating the ens-test-env plugin and receive this error, NEXT_PUBLIC_DEPLOYMENT_ADDRESSES or DEPLOYMENT_ADDRESSES is not available in the env or is malformed.

ENS_DEPLOYMENT_CHAIN=${config.ensDeploymentChain}
NEXT_PUBLIC_DEPLOYMENT_ADDRESSES=${process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || "undefined"}
DEPLOYMENT_ADDRESSES=${process.env.DEPLOYMENT_ADDRESSES || "undefined"}`,
        );
      }
    }
  });
