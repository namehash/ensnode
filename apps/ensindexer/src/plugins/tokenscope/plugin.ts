/**
 * The TokenScope plugin describes indexing behavior for:
 * - NFTs tokenizing ownership of ENS names.
 * - Marketplace activity (e.g. Seaport) for NFTs tokenizing ownership of ENS names.
 */

import {
  createPlugin,
  getDatasourceAsFullyDefinedAtCompileTime,
  namespaceContract,
} from "@/lib/plugin-helpers";
import { chainConfigForContract, chainsConnectionConfig } from "@/lib/ponder-helpers";
import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";
import * as ponder from "ponder";

const pluginName = PluginName.TokenScope;

export default createPlugin({
  name: pluginName,
  requiredDatasourceNames: [
    DatasourceNames.Seaport,
    DatasourceNames.ENSRoot,
    DatasourceNames.Basenames,
    DatasourceNames.Lineanames,
    DatasourceNames.ThreeDNSOptimism,
    DatasourceNames.ThreeDNSBase,
  ],
  createPonderConfig(config) {
    const seaport = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Seaport,
    );

    const ensroot = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ENSRoot,
    );

    const basenames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Basenames,
    );

    const lineanames = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.Lineanames,
    );

    const threeDNSOptimism = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSOptimism,
    );

    const threeDNSBase = getDatasourceAsFullyDefinedAtCompileTime(
      config.namespace,
      DatasourceNames.ThreeDNSBase,
    );

    // Sanity Check: Seaport and ENSRoot are on the same chain
    if (seaport.chain.id !== ensroot.chain.id) {
      throw new Error("Seaport and ENSRoot datasources are expected to be on the same chain");
    }

    // Sanity Check: ThreeDNSBase and Basenames are on the same chain
    if (threeDNSBase.chain.id !== basenames.chain.id) {
      throw new Error(
        "ThreeDNSBase and Basenames datasources are expected to be on the same chain",
      );
    }

    return ponder.createConfig({
      chains: {
        ...chainsConnectionConfig(config.rpcConfigs, seaport.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, ensroot.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, basenames.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, lineanames.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, threeDNSOptimism.chain.id),
        ...chainsConnectionConfig(config.rpcConfigs, threeDNSBase.chain.id),
      },
      contracts: {
        [namespaceContract(pluginName, "Seaport")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              seaport.chain.id,
              seaport.contracts.Seaport1_5,
            ),
          },
          abi: seaport.contracts.Seaport1_5.abi,
        },
        // "BaseRegistrar" for direct subnames of "eth"
        // renaming this contract to "EthBaseRegistrar" in the context of this plugin
        // to enable a distinct event handler to be created for multiple constracts
        // that otherwise share the same name
        [namespaceContract(pluginName, "EthBaseRegistrar")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.BaseRegistrar,
            ),
          },
          abi: ensroot.contracts.BaseRegistrar.abi,
        },
        // "BaseRegistrar" for subnames of "base.eth"
        // renaming this contract to "BaseBaseRegistrar" in the context of this plugin
        // to enable a distinct event handler to be created for multiple constracts
        // that otherwise share the same name
        [namespaceContract(pluginName, "BaseBaseRegistrar")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              basenames.chain.id,
              basenames.contracts.BaseRegistrar,
            ),
          },
          abi: basenames.contracts.BaseRegistrar.abi,
        },
        // "BaseRegistrar" for subnames of "linea.eth"
        // renaming this contract to "LineaBaseRegistrar" in the context of this plugin
        // to enable a distinct event handler to be created for multiple constracts
        // that otherwise share the same name
        [namespaceContract(pluginName, "LineaBaseRegistrar")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              lineanames.chain.id,
              lineanames.contracts.BaseRegistrar,
            ),
          },
          abi: lineanames.contracts.BaseRegistrar.abi,
        },
        [namespaceContract(pluginName, "NameWrapper")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              ensroot.chain.id,
              ensroot.contracts.NameWrapper,
            ),
          },
          abi: ensroot.contracts.NameWrapper.abi,
        },
        // multi-chain ThreeDNSToken indexing config
        [namespaceContract(pluginName, "ThreeDNSToken")]: {
          chain: {
            ...chainConfigForContract(
              config.globalBlockrange,
              threeDNSOptimism.chain.id,
              threeDNSOptimism.contracts.ThreeDNSToken,
            ),
            ...chainConfigForContract(
              config.globalBlockrange,
              threeDNSBase.chain.id,
              threeDNSBase.contracts.ThreeDNSToken,
            ),
          },
          // NOTE: abi is identical in a multi-chain ponder config, just use Optimism's here
          abi: threeDNSOptimism.contracts.ThreeDNSToken.abi,
        },
      },
    });
  },
});
