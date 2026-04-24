/**
 * Deterministic contract addresses from the ens-test-env devnet.
 * These addresses are produced by the Hardhat/Anvil deploy scripts in contracts-v2
 * and are stable as long as the mnemonic and deploy order remain unchanged.
 *
 * Source: `pnpm devnet` output table
 * @see https://github.com/ensdomains/contracts-v2
 */

export const DEVNET_CONTRACTS = {
  // -- DNS --
  dnssecGatewayProvider: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  dnsTxtResolver: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  dnsAliasResolver: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
  dnsTldResolver: "0x998abeb3E57409262aE5b751f60747921B33613E",
  offchainDnsResolver: "0x851356ae760d987E095750cCeb3bC6014560891C",
  simplePublicSuffixList: "0xf5059a5D33d5853360D16C683c16e67980206f36",
  dnsRegistrar: "0x202CCe504e04bEd6fC0521238dDf04Bc9E8E15aB",
  extendedDnsResolver: "0x4631BCAbD6dF18D94796344963cB60d44a4136b6",

  // -- Registries --
  legacyEnsRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  ensRegistry: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  rootRegistry: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  ethRegistry: "0x8f86403A4DE0BB5791fa46B8e795C547942fE4Cf",
  reverseRegistry: "0xCD8a1C3ba11CF5ECfa6267617243239504a98d90",

  // -- Registrars & Controllers --
  baseRegistrar: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  ethRegistrar: "0x4C4a2f8c81640e47606d3fd77B353E87Ba015584",
  legacyEthRegistrarController: "0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d",
  wrappedEthRegistrarController: "0x253553366Da8546fC250F225fe3d25d0C782303b",
  ethRegistrarController: "0x1c85638e118b37167e9298c2268758e058DdfDA0",
  batchRegistrar: "0xD8a5a9b31c3C0232E196d518E89Fd8bF83AcAd43",

  // -- Reverse Resolution --
  ethReverseRegistrar: "0x59b670e9fA9D0A427751Af201D676719a970857b",
  defaultReverseRegistrar: "0x4c5859f0F772848b2D91F1D83E2Fe57935348029",
  defaultReverseResolver: "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154",
  ethReverseResolver: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
  reverseRegistrar: "0x162A433068F51e18b7d13932F27e66a3f99E6890",
  l2ReverseRegistrar: "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff",

  // -- Resolvers --
  ensv1Resolver: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  ensv2Resolver: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
  ownedResolver: "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
  permissionedResolver: "0x5eA90aCF6555276660760fE629D72932c91f4b8E",
  legacyPublicResolver: "0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D",
  publicResolver: "0xA4899D35897033b927acFCf422bc745916139776",
  permissionedResolverImpl: "0x809d550fca64d94Bd9F66E60752A544199cfAC3D",
  universalResolver: "0x5067457698Fd6Fa1C6964e416b3f42713513B3dD",
  universalResolverV2: "0x8198f5d8F8CfFE8f9C413d98a0A55aEB8ab9FbB7",
  upgradableUniversalResolverProxy: "0x0355B7B8cb128fA5692729Ab3AAa199C1753f726",

  // -- L2 Reverse Resolvers --
  arbitrumReverseResolver: "0xf953b3A269d80e3eB0F2947630Da976B896A8C5b",
  baseReverseResolver: "0xAA292E8611aDF267e563f334Ee42320aC96D0463",
  lineaReverseResolver: "0x5c74c94173F05dA1720953407cbb920F3DF9f887",
  optimismReverseResolver: "0x720472c8ce72c2A2D711333e064ABD3E6BbEAdd3",
  scrollReverseResolver: "0xe8D2A1E88c91DCd5433208d4152Cc4F399a7e91d",

  // -- Infrastructure --
  batchGatewayProvider: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  hcaFactory: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  simpleRegistryMetadata: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  root: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  rootSecurityController: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  registrarSecurityController: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
  verifiableFactory: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
  nameWrapper: "0x5081a39b8A5f0E35a8D959395a630b68B74Dd30f",
  unlockedMigrationController: "0xdbC43Ba45381e02825b14322cDdd15eC4B3164E6",
  wrapperRegistry: "0x2E2Ed0Cfd3AD2f1d34481277b3204d807Ca2F8c2",
  lockedMigrationController: "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02",
  userRegistry: "0x7969c5eD335650692Bc04293B07F5BF2e7A673C0",
  staticMetadataService: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  migrationHelper: "0x18E317A7D70d8fBf8e6E893616b52390EbBdb629",

  // -- DNSSEC Algorithms & Digests --
  rsasha1Algorithm: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
  rsasha256Algorithm: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
  p256sha256Algorithm: "0x7a2088a1bFc9d81c55368AE168C2C02570cB814F",
  sha1Digest: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
  sha256Digest: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
  dnssecImpl: "0x67d269191c92Caf3cD7723F116c85e6E9bf55933",

  // -- Pricing --
  standardRentPriceOracle: "0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f",
  staticBulkRenewal: "0x4C2F7092C2aE51D986bEFEe378e50BD4dB99C901",
  dummyOracle: "0xD84379CEae14AA33C123Af12424A37803F885889",
  exponentialPremiumPriceOracle: "0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5",

  // -- Mock Tokens --
  mockUsdc: "0xFD471836031dc5108809D173A067e8486B9047A3",
  mockDai: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
} as const;
