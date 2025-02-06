import type { ContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * ENSDeploymentChain encodes the possible values of the root chain ENS is deployed to.
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * Encodes a unique plugin name
 */
export type PluginName = "eth" | "base" | "linea";

/**
 * Maps from PluginName to the valid & necessary contract names, which helps with typechecking.
 */
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
export type PluginContractConfig = Omit<ContractConfig, "network" | "abi">;

/**
 * Encodes a plugin's source chain and contract configs.
 */
export interface PluginConfig<CONTRACT_NAMES extends string> {
  chain: Chain;
  contracts: Record<CONTRACT_NAMES, PluginContractConfig>;
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
