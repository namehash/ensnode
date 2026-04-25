import type { Address, Hex } from "viem";
import { mnemonicToAccount } from "viem/accounts";

type NormalizedAddress = Lowercase<Address>;

function toNormalizedAddress(address: Address): NormalizedAddress {
  return address.toLowerCase() as NormalizedAddress;
}

/**
 * Deterministic contract addresses for the ENS contracts-v2 devnet used by ens-test-env.
 * Source of truth is the devnet deployment used by this repository's test harness and compose setup:
 * @see https://github.com/ensdomains/contracts-v2
 * @see https://github.com/ensdomains/ens-test-env
 */
export const contracts = {
  // -- DNS --
  dnssecGatewayProvider: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  dnsTxtResolver: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
  dnsAliasResolver: "0x322813fd9a801c5507c9de605d63cea4f2ce6c44",
  dnsTldResolver: "0x998abeb3e57409262ae5b751f60747921b33613e",
  offchainDnsResolver: "0x851356ae760d987e095750cceb3bc6014560891c",
  simplePublicSuffixList: "0xf5059a5d33d5853360d16c683c16e67980206f36",
  dnsRegistrar: "0x202cce504e04bed6fc0521238ddf04bc9e8e15ab",
  extendedDnsResolver: "0x4631bcabd6df18d94796344963cb60d44a4136b6",

  // -- Registries --
  legacyEnsRegistry: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  ensRegistry: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
  rootRegistry: "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6",
  ethRegistry: "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf",
  reverseRegistry: "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90",

  // -- Registrars & Controllers --
  baseRegistrar: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
  ethRegistrar: "0x4c4a2f8c81640e47606d3fd77b353e87ba015584",
  legacyEthRegistrarController: "0xfbc22278a96299d91d41c453234d97b4f5eb9b2d",
  wrappedEthRegistrarController: "0x253553366da8546fc250f225fe3d25d0c782303b",
  ethRegistrarController: "0x1c85638e118b37167e9298c2268758e058ddfda0",
  batchRegistrar: "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43",

  // -- Reverse Resolution --
  ethReverseRegistrar: "0x59b670e9fa9d0a427751af201d676719a970857b",
  defaultReverseRegistrar: "0x4c5859f0f772848b2d91f1d83e2fe57935348029",
  defaultReverseResolver: "0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154",
  ethReverseResolver: "0x7bc06c482dead17c0e297afbc32f6e63d3846650",
  reverseRegistrar: "0x162a433068f51e18b7d13932f27e66a3f99e6890",
  l2ReverseRegistrar: "0x49fd2be640db2910c2fab69bb8531ab6e76127ff",

  // -- Resolvers --
  ensv1Resolver: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
  ensv2Resolver: "0xc6e7df5e7b4f2a278906862b61205850344d4e7d",
  ownedResolver: "0x68b1d87f95878fe05b998f19b66f4baba5de1aed",
  permissionedResolver: "0x5ea90acf6555276660760fe629d72932c91f4b8e",
  legacyPublicResolver: "0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d",
  publicResolver: "0xa4899d35897033b927acfcf422bc745916139776",
  permissionedResolverImpl: "0x809d550fca64d94bd9f66e60752a544199cfac3d",
  universalResolver: "0x5067457698fd6fa1c6964e416b3f42713513b3dd",
  universalResolverV2: "0x8198f5d8f8cffe8f9c413d98a0a55aeb8ab9fbb7",
  upgradableUniversalResolverProxy: "0x0355b7b8cb128fa5692729ab3aaa199c1753f726",

  // -- L2 Reverse Resolvers --
  arbitrumReverseResolver: "0xf953b3a269d80e3eb0f2947630da976b896a8c5b",
  baseReverseResolver: "0xaa292e8611adf267e563f334ee42320ac96d0463",
  lineaReverseResolver: "0x5c74c94173f05da1720953407cbb920f3df9f887",
  optimismReverseResolver: "0x720472c8ce72c2a2d711333e064abd3e6bbeadd3",
  scrollReverseResolver: "0xe8d2a1e88c91dcd5433208d4152cc4f399a7e91d",

  // -- Infrastructure --
  batchGatewayProvider: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
  hcaFactory: "0x0165878a594ca255338adfa4d48449f69242eb8f",
  simpleRegistryMetadata: "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853",
  root: "0x610178da211fef7d417bc0e6fed39f05609ad788",
  rootSecurityController: "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
  registrarSecurityController: "0x0b306bf915c4d645ff596e518faf3f9669b97016",
  verifiableFactory: "0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1",
  nameWrapper: "0x5081a39b8a5f0e35a8d959395a630b68b74dd30f",
  unlockedMigrationController: "0xdbc43ba45381e02825b14322cddd15ec4b3164e6",
  wrapperRegistry: "0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2",
  lockedMigrationController: "0x51a1ceb83b83f1985a81c295d1ff28afef186e02",
  userRegistry: "0x7969c5ed335650692bc04293b07f5bf2e7a673c0",
  staticMetadataService: "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07",
  multicall3: "0xca11bde05977b3631167028862be2a173976ca11",
  migrationHelper: "0x18e317a7d70d8fbf8e6e893616b52390ebbdb629",

  // -- DNSSEC Algorithms & Digests --
  rsasha1Algorithm: "0xa85233c63b9ee964add6f2cffe00fd84eb32338f",
  rsasha256Algorithm: "0x4a679253410272dd5232b3ff7cf5dbb88f295319",
  p256sha256Algorithm: "0x7a2088a1bfc9d81c55368ae168c2c02570cb814f",
  sha1Digest: "0x09635f643e140090a9a8dcd712ed6285858cebef",
  sha256Digest: "0xc5a5c42992decbae36851359345fe25997f5c42d",
  dnssecImpl: "0x67d269191c92caf3cd7723f116c85e6e9bf55933",

  // -- Pricing --
  standardRentPriceOracle: "0x1429859428c0abc9c2c47c8ee9fbaf82cfa0f20f",
  staticBulkRenewal: "0x4c2f7092c2ae51d986befee378e50bd4db99c901",
  dummyOracle: "0xd84379ceae14aa33c123af12424a37803f885889",
  exponentialPremiumPriceOracle: "0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5",

  // -- Mock Tokens --
  mockUsdc: "0xfd471836031dc5108809d173a067e8486b9047a3",
  mockDai: "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc",
} as const satisfies Record<string, NormalizedAddress>;

const mnemonic = "test test test test test test test test test test test junk";

function createAccount(addressIndex: number) {
  const account = mnemonicToAccount(mnemonic, { addressIndex });
  return { ...account, address: toNormalizedAddress(account.address) };
}

export const accounts = {
  deployer: createAccount(0),
  owner: createAccount(1),
  user: createAccount(2),
  user2: createAccount(3),
} as const;

export const addresses = {
  one: toNormalizedAddress(`0x${"1".repeat(40)}` as Address),
} as const satisfies Record<string, NormalizedAddress>;

export const fixtures = {
  abiBytes: `0x${"01".repeat(32)}`,
  fourBytesInterface: "0x11100111",
  publicKeyX: `0x${"02".repeat(32)}`,
  publicKeyY: `0x${"03".repeat(32)}`,
  contenthash: `0x${"04".repeat(32)}`,
  bitcoinAddress: `0x${"05".repeat(25)}`,
  litecoinAddress: `0x${"06".repeat(25)}`,
} as const satisfies Record<string, Hex>;
