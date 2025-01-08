import { createConfig, factory } from "ponder";
import { http, getAbiItem } from "viem";
import { base } from "viem/chains";

import { createPluginNamespace } from "../../lib/plugin-helpers";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver } from "./abis/L2Resolver";
import { RegistrarController } from "./abis/RegistrarController";
import { Registry } from "./abis/Registry";

export const ownedName = "base.eth" as const;

export const pluginNamespace = createPluginNamespace(ownedName);

export const config = createConfig({
  networks: {
    base: {
      chainId: base.id,
      transport: http(process.env[`RPC_URL_${base.id}`]),
    },
  },
  contracts: {
    [pluginNamespace("Registry")]: {
      network: "base",
      abi: Registry,
      address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
      startBlock: 17571480,
    },
    [pluginNamespace("Resolver")]: {
      network: "base",
      abi: L2Resolver,
      address: factory({
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: 17575714,
    },
    [pluginNamespace("BaseRegistrar")]: {
      network: "base",
      abi: BaseRegistrar,
      address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
      startBlock: 17571486,
    },
    [pluginNamespace("EARegistrarController")]: {
      network: "base",
      abi: EarlyAccessRegistrarController,
      address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
      startBlock: 17575699,
    },
    [pluginNamespace("RegistrarController")]: {
      network: "base",
      abi: RegistrarController,
      address: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5",
      startBlock: 18619035,
    },
  },
});

export async function activate() {
  const ponderIndexingModules = await Promise.all([
    import("./handlers/Registry"),
    import("./handlers/Registrar"),
    import("./handlers/Resolver"),
  ]);

  ponderIndexingModules.map((m) => m.default());
}
