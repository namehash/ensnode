import type { ContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * A plugin name.
 *
 */
export type PluginName = "eth" | "base" | "linea";

export type PluginContractNames = {
  eth:
    | "RegistryOld"
    | "Registry"
    | "Resolver"
    | "BaseRegistrar"
    | "EthRegistrarControllerOld"
    | "EthRegistrarController"
    | "NameWrapper";
  base:
    | "Registry" //
    | "Resolver"
    | "BaseRegistrar"
    | "EARegistrarController"
    | "RegistrarController";
  linea:
    | "Registry" //
    | "Resolver"
    | "BaseRegistrar"
    | "EthRegistrarController"
    | "NameWrapper";
};

/**
 * A `ponder#ContractConfig` sans network, as it is provided by the contextual 'deployment'.
 */
export type AddressBookContractConfig = Omit<ContractConfig, "network">;

/**
 * Encodes the set of `ponder#ContractConfig`s within a plugin that indexes specific contracts.
 */
export type ContractsConfig<CONTRACT_NAMES extends string> = Record<
  CONTRACT_NAMES,
  AddressBookContractConfig
>;

/**
 * Encodes a plugin's source chain and contract configs
 */
export interface PluginConfig<CONTRACT_NAMES extends string> {
  chain: Record<string, Chain>;
  contracts: ContractsConfig<CONTRACT_NAMES>;
}

/**
 * A 'deployment' of ENS is a single, unified namespace of ENS names across potentially many chains
 * and sub-registries.Each plugin represented here encodes logic for indexing names managed by a
 * sub-registry (usually but not necessarily deployed to different chains).
 *
 * For example, the canonical ETH Mainnet deployment of ENS includes names managed by the ETH
 * Registry, as well as the Base and Linea L2 Registries. The logic for indexing each of these
 * registries is managed by its associated plugin, whose contract configuration is specified here.
 *
 * The Sepolia and Holesky testnet ENS Deployments are completely independent of the canonical ETH
 * Mainnet deployment. These testnet ENS deployments use the .eth plugin (perhaps better named 'root'),
 * but configured with the requisite addresses.
 *
 * The ens-test-env deployment is the version of ENS deployed to a local Anvil chain while testing.
 */
export type ENSDeploymentConfig = {
  eth: PluginConfig<PluginContractNames["eth"]>;
  base?: PluginConfig<PluginContractNames["base"]>;
  linea?: PluginConfig<PluginContractNames["linea"]>;
};

// ENSDeploymentChain encodes the possible values of the root chain ENS is deployed to
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";
