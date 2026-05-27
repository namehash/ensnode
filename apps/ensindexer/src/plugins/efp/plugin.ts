/**
 * The EFP plugin indexes the Ethereum Follow Protocol:
 * - list NFTs (`ListRegistry` on Base),
 * - list records & tags (`ListRecords` on Base, Optimism, and Ethereum mainnet),
 * - account metadata (`AccountMetadata` on Base), and
 * - the `eth.efp.list` ENS text record (any Resolver on Ethereum mainnet).
 *
 * EFP does not consume ENS protocol data; it indexes its own contracts, sourced from the EFP
 * datasources, which exist only on the `mainnet` ENS namespace — so the plugin can only be
 * activated there (datasource-presence validation enforces this).
 */

import * as ponder from "ponder";

import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { createPlugin, namespaceContract } from "@/lib/plugin-helpers";
import {
  chainConfigForContract,
  chainsConnectionConfig,
  getRequiredDatasources,
} from "@/lib/ponder-helpers";

const pluginName = PluginName.EFP;

const REQUIRED_DATASOURCE_NAMES = [
  DatasourceNames.EFPBase,
  DatasourceNames.EFPOptimism,
  DatasourceNames.EFPEthereum,
];

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  allDatasourceNames: REQUIRED_DATASOURCE_NAMES,
  createPonderConfig(config) {
    const { efpBase, efpOptimism, efpEthereum } = getRequiredDatasources(
      config.namespace,
      REQUIRED_DATASOURCE_NAMES,
    );

    return ponder.createConfig({
      chains: {
        ...chainsConnectionConfig(config.rpcConfigs, efpBase.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, efpOptimism.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, efpEthereum.chain.id),
      },
      contracts: {
        // ListRegistry + AccountMetadata are deployed only on Base.
        [namespaceContract(pluginName, "ListRegistry")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              efpBase.chain.id,
              efpBase.contracts.ListRegistry,
            ),
          },
          abi: efpBase.contracts.ListRegistry.abi,
        },
        [namespaceContract(pluginName, "AccountMetadata")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              efpBase.chain.id,
              efpBase.contracts.AccountMetadata,
            ),
          },
          abi: efpBase.contracts.AccountMetadata.abi,
        },
        // ListRecords is deployed on Base, Optimism, and Ethereum mainnet (identical ABI).
        [namespaceContract(pluginName, "ListRecords")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              efpBase.chain.id,
              efpBase.contracts.ListRecords,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              efpOptimism.chain.id,
              efpOptimism.contracts.ListRecords,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              efpEthereum.chain.id,
              efpEthereum.contracts.ListRecords,
            ),
          },
          abi: efpBase.contracts.ListRecords.abi,
        },
        // Address-less Resolver subscription on Ethereum mainnet for the `eth.efp.list` text record.
        // Matches any contract emitting the standard TextChanged event (Ponder factory-mode); the
        // handler filters to the well-known key.
        [namespaceContract(pluginName, "Resolver")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              efpEthereum.chain.id,
              efpEthereum.contracts.Resolver,
            ),
          },
          abi: efpEthereum.contracts.Resolver.abi,
        },
      },
    });
  },
});
