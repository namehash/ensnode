/**
 * The EFP plugin indexes the Ethereum Follow Protocol:
 * - list NFTs (`ListRegistry` on Base),
 * - list records & tags (`ListRecords` on Base, Optimism, and Ethereum mainnet), and
 * - account metadata (`AccountMetadata` on Base).
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
      },
    });
  },
});
