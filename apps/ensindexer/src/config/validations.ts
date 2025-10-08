import { DatasourceName, getENSRootChainId } from "@ensnode/datasources";
import { Address, isAddress } from "viem";
import { z } from "zod/v4";

import { getENSNamespaceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { getPlugin } from "@/plugins";
import {
  asLowerCaseAddress,
  isHttpProtocol,
  isWebSocketProtocol,
  uniq,
} from "@ensnode/ensnode-sdk";
import type { ENSIndexerConfig } from "./types";

// type alias to highlight the input param of Zod's check() method
type ZodCheckFnInput<T> = z.core.ParsePayload<T>;

// Invariant: specified plugins' datasources are available in the specified namespace's Datasources
export function invariant_requiredDatasources(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "namespace" | "plugins">>,
) {
  const { value: config } = ctx;

  const datasources = getENSNamespaceAsFullyDefinedAtCompileTime(config.namespace);
  const availableDatasourceNames = Object.keys(datasources) as DatasourceName[];

  // validate that each active plugin's requiredDatasources are available in availableDatasourceNames
  for (const pluginName of config.plugins) {
    const { requiredDatasourceNames } = getPlugin(pluginName);
    const hasRequiredDatasources = requiredDatasourceNames.every((datasourceName) =>
      availableDatasourceNames.includes(datasourceName),
    );

    if (!hasRequiredDatasources) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `Requested plugin '${pluginName}' cannot be activated for the ${
          config.namespace
        } ENS namespace. ${pluginName} specifies dependent datasources: [${requiredDatasourceNames.join(
          ", ",
        )}], but available datasources in the ${
          config.namespace
        } namespace are: [${availableDatasourceNames.join(", ")}].`,
      });
    }
  }
}

// Invariant: rpcConfig is specified for the ENS Root Chain of the configured namespace
export function invariant_rpcConfigsSpecifiedForRootChain(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "namespace" | "rpcConfigs">>,
) {
  const { value: config } = ctx;

  const ensRootChainId = getENSRootChainId(config.namespace);

  if (!config.rpcConfigs.has(ensRootChainId)) {
    ctx.issues.push({
      code: "custom",
      input: config,
      message: `An RPC_URL_${ensRootChainId} (for the ENS Root Chain) is required, but none was specified.`,
    });
  }
}

// Invariant: rpcConfig is specified for each indexed chain
export function invariant_rpcConfigsSpecifiedForIndexedChains(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "namespace" | "plugins" | "rpcConfigs">>,
) {
  const { value: config } = ctx;

  const datasources = getENSNamespaceAsFullyDefinedAtCompileTime(config.namespace);

  for (const pluginName of config.plugins) {
    const datasourceNames = getPlugin(pluginName).requiredDatasourceNames;

    for (const datasourceName of datasourceNames) {
      const { chain } = datasources[datasourceName];

      if (!config.rpcConfigs.has(chain.id)) {
        ctx.issues.push({
          code: "custom",
          input: config,
          message: `Plugin '${pluginName}' indexes chain with id ${chain.id} but RPC_URL_${chain.id} is not specified.`,
        });
      }
    }
  }
}

// Invariant: if a global blockrange is defined, only one chain is indexed
export function invariant_globalBlockrange(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "globalBlockrange" | "namespace" | "plugins">>,
) {
  const { value: config } = ctx;
  const { globalBlockrange } = config;

  if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
    const datasources = getENSNamespaceAsFullyDefinedAtCompileTime(config.namespace);
    const indexedChainIds = uniq(
      config.plugins
        .flatMap((pluginName) => getPlugin(pluginName).requiredDatasourceNames)
        .map((datasourceName) => datasources[datasourceName])
        .map((datasource) => datasource.chain.id),
    );

    if (indexedChainIds.length > 1) {
      ctx.issues.push({
        code: "custom",
        input: config,
        message: `ENSIndexer's behavior when indexing _multiple chains_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains. The config currently is:

  NAMESPACE=${config.namespace}
  PLUGINS=${config.plugins.join(",")}
  START_BLOCK=${globalBlockrange.startBlock || "n/a"}
  END_BLOCK=${globalBlockrange.endBlock || "n/a"}

  The usage you're most likely interested in is:
    NAMESPACE=(mainnet|sepolia|holesky) PLUGINS=subgraph END_BLOCK=x pnpm run start
  which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.

  In the future, indexing multiple chains with chain-specific blockrange constraints may be possible.`,
      });
    }
  }
}

// Invariant: all contracts have a valid ContractConfig defined
export function invariant_validContractConfigs(
  ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "namespace">>,
) {
  const { value: config } = ctx;

  const datasources = getENSNamespaceAsFullyDefinedAtCompileTime(config.namespace);
  for (const datasourceName of Object.keys(datasources) as DatasourceName[]) {
    const { contracts } = datasources[datasourceName];

    // Invariant: `contracts` must provide valid addresses if a filter is not provided
    for (const [contractName, contractConfig] of Object.entries(contracts)) {
      if ("address" in contractConfig && typeof contractConfig.address === "string") {
        // only ContractConfigs with `address` defined
        const isValidAddress =
          isAddress(contractConfig.address as Address, { strict: false }) && // must be a valid `Address`
          contractConfig.address === asLowerCaseAddress(contractConfig.address); // and in lowercase format

        if (!isValidAddress) {
          throw new Error(
            `The '${config.namespace}' namespace's '${datasourceName}' Datasource does not define a valid address for ${contractName}: '${contractConfig.address}'. This occurs if the address property of any ContractConfig in the Datasource is malformed (i.e. not a viem#Address). This is only likely to occur if you are actively editing the Datasource and typo'd an address.`,
          );
        }
      }
    }
  }
}

/**
 * Invariant: RPC endpoint configuration for a chain must include at least one http/https protocol URL.
 */
export function invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL(
  ctx: ZodCheckFnInput<URL[]>,
) {
  const endpoints = ctx.value;
  const httpEndpoints = endpoints.filter(isHttpProtocol);

  if (httpEndpoints.length < 1) {
    ctx.issues.push({
      code: "custom",
      input: endpoints,
      message: `RPC endpoint configuration for a chain must include at least one http/https protocol URL.`,
    });
  }
}

/**
 * Invariant: RPC configuration for a chain must include at most one WS/WSS protocol URL.
 */
export function invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL(
  ctx: ZodCheckFnInput<URL[]>,
) {
  const endpoints = ctx.value;
  const wsEndpoints = endpoints.filter(isWebSocketProtocol);

  if (wsEndpoints.length > 1) {
    ctx.issues.push({
      code: "custom",
      input: endpoints,
      message: `RPC endpoint configuration for a chain must include at most one websocket (ws/wss) protocol URL.`,
    });
  }
}
