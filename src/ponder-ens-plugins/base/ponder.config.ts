import { factory } from "ponder";
import { http, getAbiItem } from "viem";
import { base, mainnet } from "viem/chains";

import { type NsReturnType, createNs } from "../chain";

// Replacing ABIs with the Base-specific ones, as per https://github.com/base-org/basenames?tab=readme-ov-file#architecture
// import { BaseRegistrar } from "./abis/BaseRegistrar";
// import { EthRegistrarController } from "./abis/EthRegistrarController";
// import { EthRegistrarControllerOld } from "./abis/EthRegistrarControllerOld";
// import { LegacyPublicResolver } from "./abis/LegacyPublicResolver";
// import { NameWrapper } from "./abis/NameWrapper";
// import { Registry } from "./abis/Registry";
// import { Resolver } from "./abis/Resolver";

import { BaseRegistrar } from "./abis/BaseRegistrar";
import { L2Resolver } from "./abis/L2Resolver";
import { RegistrarController } from "./abis/RegistrarController";
import { Registry } from "./abis/Registry";

// just for testing...
const END_BLOCK = 20_200_200;

export const ns = createNs(base.id);

export type NsType<T extends string> = NsReturnType<T, typeof base.id>;

const REGISTRY_ADDRESS = '0xb94704422c2a1e396835a571837aa5ae53285a95';
const REGISTRY_START_BLOCK = 17571480;

const BASE_REGISTRAR_ADDRESS = '0x03c4738Ee98aE44591e1A4A4F3CaB6641d95DD9a';
const BASE_REGISTRAR_START_BLOCK = 17571486;

const REGISTRAR_CONTROLLER_ADDRESS = '0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5';
const REGISTRAR_CONTROLLER_START_BLOCK = 18619035;

const REVERSE_REGISTRAR_ADDRESS = '0x79ea96012eea67a83431f1701b3dff7e37f9e282';
const REVERSE_REGISTRAR_START_BLOCK = 17571485;

const L1_RESOLVER_ADDRESS = '0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31';
const L1_RESOLVER_START_BLOCK = 20420641;

const L2_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
const L2_RESOLVER_START_BLOCK = 17575714;

export const config = Object.freeze({
  networks: {
    base: {
      chainId: base.id,
      transport: http(process.env[`PONDER_RPC_URL_${base.id}`]),
    },
    mainnet: {
      chainId: mainnet.id,
      transport: http(process.env[`PONDER_RPC_URL_${mainnet.id}`]),
    },
  },
  contracts: {
    [ns("Registry")]: {
      network: "base",
      abi: Registry,
      address: REGISTRY_ADDRESS,
      startBlock: REGISTRY_START_BLOCK,
      endBlock: END_BLOCK,
    },
    [ns("Resolver")]: {
      network: "base",
      abi: L2Resolver,
      address: factory({
        address: L2_RESOLVER_ADDRESS,
        event: getAbiItem({ abi: Registry, name: "NewResolver" }),
        parameter: "resolver",
      }),
      startBlock: L2_RESOLVER_START_BLOCK,
      endBlock: END_BLOCK,
    },
    [ns("BaseRegistrar")]: {
      network: "base",
      abi: BaseRegistrar,
      address: BASE_REGISTRAR_ADDRESS,
      startBlock: 9380410,
      endBlock: END_BLOCK,
    },
    [ns("RegistrarController")]: {
      network: "base",
      abi: RegistrarController,
      address: REGISTRAR_CONTROLLER_ADDRESS,
      startBlock: Math.min(REGISTRAR_CONTROLLER_START_BLOCK, END_BLOCK),
      endBlock: END_BLOCK,
    },
  },
} as const);
