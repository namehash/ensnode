import { ContractConfig, createConfig, factory, mergeAbis } from "ponder";
import { http, getAbiItem } from "viem";

import { mainnet } from "viem/chains";
import { blockConfig, rpcRequestRateLimit } from "../../lib/helpers";
import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EthRegistrarController } from "./abis/EthRegistrarController";
import { EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
import { NameWrapper } from "./abis/NameWrapper";
import { Registry } from "./abis/Registry";
import { Resolver } from "./abis/Resolver";

const RESOLVER_ABI = mergeAbis([LegacyPublicResolver, Resolver]);

export const ownedName = "eth";

export const pluginNamespace = createPluginNamespace(ownedName);

// demo for `didsendit.eth`
// minted at block: 21_610_362

// constrain the ponder indexing between the following start/end blocks
// https://ponder.sh/0_6/docs/contracts-and-networks#block-range
const START_BLOCK: ContractConfig["startBlock"] = 21_610_262;
const END_BLOCK: ContractConfig["endBlock"] = undefined;

export const config = createConfig({
  networks: {
    mainnet: {
      chainId: mainnet.id,
      transport: http(process.env[`RPC_URL_${mainnet.id}`]),
      maxRequestsPerSecond: rpcRequestRateLimit(mainnet.id),
    },
  },
  contracts: {
    [pluginNamespace("RegistryOld")]: {
      network: "mainnet",
      abi: Registry,
      address: "0x314159265dd8dbb310642f98f50c066173c1259b",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("Registry")]: {
      network: "mainnet",
      abi: Registry,
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("OldRegistryResolvers")]: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: "0x314159265dd8dbb310642f98f50c066173c1259b",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("Resolver")]: {
      network: "mainnet",
      abi: RESOLVER_ABI,
      address: factory({
        address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "mainnet",
      abi: BaseRegistrar,
      address: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("EthRegistrarControllerOld")]: {
      network: "mainnet",
      abi: EthRegistrarControllerOld,
      address: "0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("EthRegistrarController")]: {
      network: "mainnet",
      abi: EthRegistrarController,
      address: "0x253553366Da8546fC250F225fe3d25d0C782303b",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
    [pluginNamespace("NameWrapper")]: {
      network: "mainnet",
      abi: NameWrapper,
      address: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
      startBlock: START_BLOCK,
      endBlock: END_BLOCK,
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/EthRegistrar"),
    import("./handlers/Resolver"),
    import("./handlers/NameWrapper"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
