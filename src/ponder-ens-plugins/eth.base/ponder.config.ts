import { createConfig, factory } from "ponder";
import { http, getAbiItem } from "viem";
import { base } from "viem/chains";

import { NsReturnType, createNs } from "../../lib/plugins";
import { BaseRegistrar } from "./abis/BaseRegistrar";
import { EarlyAccessRegistrarController } from "./abis/EARegistrarController";
import { L2Resolver } from "./abis/L2Resolver";
import { RegistrarController } from "./abis/RegistrarController";
import { Registry } from "./abis/Registry";

export const baseName = ".base.eth" as const;

const nestedNamespace = "/eth/base" as const;
export const ns = createNs(nestedNamespace);
export type NsType<T extends string> = NsReturnType<T, typeof nestedNamespace>;

const START_BLOCK = undefined; // 17607350;
const END_BLOCK = undefined; // 17607351;

export const config = createConfig({
  networks: {
    base: {
      chainId: base.id,
      transport: http(process.env[`PONDER_RPC_URL_${base.id}`]),
    },
  },
  contracts: {
    [ns("Registry")]: {
      network: "base",
      abi: Registry,
      address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
      startBlock: START_BLOCK || 17571480,
      endBlock: END_BLOCK,
    },
    [ns("Resolver")]: {
      network: "base",
      abi: L2Resolver,
      address: factory({
        address: "0xb94704422c2a1e396835a571837aa5ae53285a95",
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: START_BLOCK || 17575714,
      endBlock: END_BLOCK,
    },
    [ns("BaseRegistrar")]: {
      network: "base",
      abi: BaseRegistrar,
      address: "0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a",
      startBlock: START_BLOCK || 17571486,
      endBlock: END_BLOCK,
    },
    [ns("EARegistrarController")]: {
      network: "base",
      abi: EarlyAccessRegistrarController,
      address: "0xd3e6775ed9b7dc12b205c8e608dc3767b9e5efda",
      startBlock: START_BLOCK || 17575699,
      endBlock: END_BLOCK,
    },
    [ns("RegistrarController")]: {
      network: "base",
      abi: RegistrarController,
      address: "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5",
      startBlock: START_BLOCK || 18619035,
      endBlock: END_BLOCK,
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
