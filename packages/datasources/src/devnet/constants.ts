import type { NormalizedAddress } from "enssdk";

/**
 * Deterministic contract addresses for the ENS contracts-v2 devnet used by ens-test-env.
 * Keys use the same PascalCase names as the contracts-v2 contract table output.
 * Use `pnpm devnet` to see actual data in devnet
 *
 * @see docker/services/devnet.yml
 */
export const contracts = {
  // -- DNS --
  DNSSECGatewayProvider: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  DNSTXTResolver: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512",
  DNSAliasResolver: "0x322813fd9a801c5507c9de605d63cea4f2ce6c44",
  DNSTLDResolver: "0x998abeb3e57409262ae5b751f60747921b33613e",
  OffchainDNSResolver: "0x851356ae760d987e095750cceb3bc6014560891c",
  SimplePublicSuffixList: "0xf5059a5d33d5853360d16c683c16e67980206f36",
  DNSRegistrar: "0xf4b146fba71f41e0592668ffbf264f1d186b2ca8",
  ExtendedDNSResolver: "0x86a2ee8faf9a840f7a2c64ca3d51209f9a02081d",

  // -- Registries --
  LegacyENSRegistry: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
  ENSRegistry: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
  RootRegistry: "0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6",
  ETHRegistry: "0x8f86403a4de0bb5791fa46b8e795c547942fe4cf",
  ReverseRegistry: "0xcd8a1c3ba11cf5ecfa6267617243239504a98d90",

  // -- Registrars & Controllers --
  BaseRegistrarImplementation: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
  ETHRegistrar: "0x21df544947ba3e8b3c32561399e88b52dc8b2823",
  LegacyETHRegistrarController: "0x46b142dd1e924fab83ecc3c08e4d46e82f005e0e",
  WrappedETHRegistrarController: "0x253553366da8546fc250f225fe3d25d0c782303b",
  ETHRegistrarController: "0x367761085bf3c12e5da2df99ac6e1a824612b8fb",
  BatchRegistrar: "0xdc11f7e700a4c898ae5caddb1082cffa76512add",

  // -- Reverse Resolution --
  ETHReverseRegistrar: "0x59b670e9fa9d0a427751af201d676719a970857b",
  DefaultReverseRegistrar: "0x4c5859f0f772848b2d91f1d83e2fe57935348029",
  DefaultReverseResolver: "0x5f3f1dbd7b74c6b46e8c44f98792a1daf8d69154",
  ETHReverseResolver: "0x7bc06c482dead17c0e297afbc32f6e63d3846650",
  ReverseRegistrar: "0x162a433068f51e18b7d13932f27e66a3f99e6890",
  L2ReverseRegistrar: "0x4631bcabd6df18d94796344963cb60d44a4136b6",

  // -- Resolvers --
  ENSV1Resolver: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
  ENSV2Resolver: "0xc6e7df5e7b4f2a278906862b61205850344d4e7d",
  OwnedResolver: "0x68b1d87f95878fe05b998f19b66f4baba5de1aed",
  PermissionedResolver: "0x8550d35164e7f86bb6adf4cedb3f012913c9d563",
  LegacyPublicResolver: "0xa4899d35897033b927acfcf422bc745916139776",
  PublicResolver: "0xf953b3a269d80e3eb0f2947630da976b896a8c5b",
  PermissionedResolverImpl: "0x809d550fca64d94bd9f66e60752a544199cfac3d",
  UniversalResolver: "0xaa292e8611adf267e563f334ee42320ac96d0463",
  UniversalResolverV2: "0x0355b7b8cb128fa5692729ab3aaa199c1753f726",
  UpgradableUniversalResolverProxy: "0x202cce504e04bed6fc0521238ddf04bc9e8e15ab",

  // -- Infrastructure --
  BatchGatewayProvider: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
  HCAFactory: "0x0165878a594ca255338adfa4d48449f69242eb8f",
  SimpleRegistryMetadata: "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853",
  Root: "0x610178da211fef7d417bc0e6fed39f05609ad788",
  RootSecurityController: "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
  RegistrarSecurityController: "0x0b306bf915c4d645ff596e518faf3f9669b97016",
  VerifiableFactory: "0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1",
  NameWrapper: "0x5081a39b8a5f0e35a8d959395a630b68b74dd30f",
  UnlockedMigrationController: "0xdbc43ba45381e02825b14322cddd15ec4b3164e6",
  ApprovedUpgradeGate: "0x4c4a2f8c81640e47606d3fd77b353e87ba015584",
  WrapperRegistryImpl: "0xd8a5a9b31c3c0232e196d518e89fd8bf83acad43",
  LockedMigrationController: "0x36b58f5c1969b7b6591d752ea6f5486d069010ab",
  UserRegistryImpl: "0x7969c5ed335650692bc04293b07f5bf2e7a673c0",
  StaticMetadataService: "0xb0d4afd8879ed9f52b28595d31b441d079b2ca07",
  Multicall3: "0xca11bde05977b3631167028862be2a173976ca11",
  MigrationHelper: "0x5c74c94173f05da1720953407cbb920f3df9f887",

  // -- DNSSEC Algorithms & Digests --
  RSASHA1Algorithm: "0xa85233c63b9ee964add6f2cffe00fd84eb32338f",
  RSASHA256Algorithm: "0x4a679253410272dd5232b3ff7cf5dbb88f295319",
  P256SHA256Algorithm: "0x7a2088a1bfc9d81c55368ae168c2c02570cb814f",
  SHA1Digest: "0x09635f643e140090a9a8dcd712ed6285858cebef",
  SHA256Digest: "0xc5a5c42992decbae36851359345fe25997f5c42d",
  DNSSECImpl: "0x67d269191c92caf3cd7723f116c85e6e9bf55933",

  // -- Pricing --
  StandardRentPriceOracle: "0x1429859428c0abc9c2c47c8ee9fbaf82cfa0f20f",
  StaticBulkRenewal: "0x7a9ec1d04904907de0ed7b6839ccdd59c3716ac9",
  DummyOracle: "0x2b0d36facd61b71cc05ab8f3d2355ec3631c0dd5",
  ExponentialPremiumPriceOracle: "0xfbc22278a96299d91d41c453234d97b4f5eb9b2d",

  // -- Mock Tokens --
  MockUSDC: "0xfd471836031dc5108809d173a067e8486b9047a3",
  MockDAI: "0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc",
} as const satisfies Record<string, NormalizedAddress>;

/**
 * Deterministic addresses of the EFP (Ethereum Follow Protocol) contracts, deployed onto the
 * ens-test-env devnet (chain 31337) by the EFP devnet image in attach mode, on top of the
 * contracts-v2 ENS deployment. The three contracts the EFP plugin indexes, plus the `EFPListMinter`
 * (not indexed) which the integration-test EFP seeder uses to mint lists.
 *
 * These addresses depend on the deployer's (Anvil account 0) nonce after the ENS deployment, so
 * they are a function of BOTH the pinned ENS devnet image (`docker/services/devnet.yml`, run with
 * `--testNames`) and the pinned EFP devnet image (`docker/services/efp-devnet.yml`). They were
 * verified stable across clean redeploys. Re-capture whenever either image pin is bumped:
 *
 *   docker compose -f docker/docker-compose.devnet.yml up devnet efp-devnet
 *   docker exec efp-devnet cat /app/deployments/devnet-31337.json
 *
 * @see https://github.com/ethereumfollowprotocol/contracts/pull/7
 */
export const efpContracts = {
  EFPAccountMetadata: "0xd5ac451b0c50b9476107823af206ed814a2e2580",
  EFPListRegistry: "0xf8e31cb472bc70500f08cd84917e5a1912ec8397",
  EFPListRecords: "0xc0f115a19107322cfbf1cdbc7ea011c19ebdb4f8",
  EFPListMinter: "0xc96304e3c037f81da488ed9dea1d8f2a48278a75",
} as const satisfies Record<string, NormalizedAddress>;
