import { z } from "zod/v4";

import type { ENSIndexerConfig } from "@/config/types";
import { uniq } from "@/lib/lib-helpers";
import { PLUGIN_REQUIRED_DATASOURCES } from "@/plugins";
import { DatasourceName, getENSDeployment } from "@ensnode/ens-deployments";
import { PluginName } from "@ensnode/ensnode-sdk";
import { Address, isAddress } from "viem";

// Invariant: specified plugins' datasources are available in the specified ensDeploymentChain's ENSDeployment
export function invariant_requiredDatasources(ctx: z.core.ParsePayload<ENSIndexerConfig>) {
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
}

// Invariant: rpcConfig is specified for each indexed chain
export function invariant_rpcConfigsSpecifiedForIndexedChains(
  ctx: z.core.ParsePayload<ENSIndexerConfig>,
) {
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
}

// Invariant: if a global blockrange is defined, only one network is indexed
export function invariant_globalBlockrange(ctx: z.core.ParsePayload<ENSIndexerConfig>) {
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
}

// Invariant: all contracts have a valid ContractConfig defined
export function invariant_validContractConfigs(ctx: z.core.ParsePayload<ENSIndexerConfig>) {
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
}

// Invariant: ReverseResolvers plugin requires indexAdditionalResolverRecords
export function invariant_reverseResolversPluginNeedsResolverRecords(
  ctx: z.core.ParsePayload<ENSIndexerConfig>,
) {
  const { value: config } = ctx;

  if (
    config.plugins.includes(PluginName.ReverseResolvers) &&
    !config.indexAdditionalResolverRecords
  ) {
    ctx.issues.push({
      code: "custom",
      input: config,
      message: `The 'reverse-resolvers' plugin requires INDEX_ADDITIONAL_RESOLVER_RECORDS to be 'true'.`,
    });
  }
}
