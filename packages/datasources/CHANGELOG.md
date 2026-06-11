# @ensnode/ens-deployments

## 1.15.2

### Patch Changes

- [#2242](https://github.com/namehash/ensnode/pull/2242) [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54) Thanks [@shrugs](https://github.com/shrugs)! - Add contract identification by address. `@ensnode/datasources` exports `identifyDatasourceContracts(namespaceId, query)`, which finds every well-known contract in a namespace's datasources whose address matches a given address, optionally scoped to a chain.

- [#2191](https://github.com/namehash/ensnode/pull/2191) [`39cb445`](https://github.com/namehash/ensnode/commit/39cb445b8d8790aa9d6fe2ee904e60bdb158efbd) Thanks [@tk-o](https://github.com/tk-o)! - Updates the `sepolia-v2` ENS Namespace to support the latest ENSv1+ENSv2 test deployment on Sepolia.

- [#2267](https://github.com/namehash/ensnode/pull/2267) [`6165f50`](https://github.com/namehash/ensnode/commit/6165f50e26729c6d740c7424034057642f5175b5) Thanks [@shrugs](https://github.com/shrugs)! - Consolidate UniversalResolver onto the `IUniversalResolver` proxy. Each ENSRoot Datasource now exposes a single `UniversalResolver` contract pointing at the proxy address (`0xeeeeeeee14d718c2b47d9923deab1335e144eeee` on mainnet/sepolia), replacing the separate `UniversalResolver` (V1) and `UniversalResolverV2` contracts. The exported `UniversalResolverABI` is now `IUniversalResolver` merged with `IMulticallable`.

- Updated dependencies [[`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523)]:
  - enssdk@1.15.2

## 1.15.1

### Patch Changes

- Updated dependencies []:
  - enssdk@1.15.1

## 1.15.0

### Patch Changes

- Updated dependencies [[`9c40ef1`](https://github.com/namehash/ensnode/commit/9c40ef12b5c5e8a08aa1659b0626c0b87486a7d1)]:
  - enssdk@1.15.0

## 1.14.0

### Patch Changes

- Updated dependencies []:
  - enssdk@1.14.0

## 1.13.1

### Patch Changes

- [#2082](https://github.com/namehash/ensnode/pull/2082) [`b32f09d`](https://github.com/namehash/ensnode/commit/b32f09dec275196c816b722023a197d3e91a37b1) Thanks [@shrugs](https://github.com/shrugs)! - Hotfix: re-release of 1.13.0 including the documented changes to the Sepolia Namespace to include Basenames and Lineanames L1 Resolvers.

## 1.13.0

### Minor Changes

- [#2080](https://github.com/namehash/ensnode/pull/2080) [`57bbef2`](https://github.com/namehash/ensnode/commit/57bbef28e24323a4c2f8326512d185a5e4662254) Thanks [@shrugs](https://github.com/shrugs)! - Fixes BasenamesL1Resolver and LineanamesL1Resolver not being defined in the Sepolia namespace, causing ENSIndexer to crash when indexing Sepolia.

## 1.12.0

## 1.11.1

## 1.11.0

### Minor Changes

- [#2036](https://github.com/namehash/ensnode/pull/2036) [`43d8a9b`](https://github.com/namehash/ensnode/commit/43d8a9b838b15719f520cd3f3bbfd1b52a4ad1ce) Thanks [@shrugs](https://github.com/shrugs)! - Update sepolia-v2 namespace to point to the most recent Sepolia V2 deployment on the virtual Sepolia chain.

### Patch Changes

- [#2049](https://github.com/namehash/ensnode/pull/2049) [`5729ac1`](https://github.com/namehash/ensnode/commit/5729ac18ba029a476ffeca18c9b4bceee417ebdb) Thanks [@shrugs](https://github.com/shrugs)! - Removed `LegacyEthRegistrarController`, `WrappedEthRegistrarController`, and `UniversalRegistrarRenewalWithReferrer` placeholder entries from the `sepolia-v2` namespace, and `UniversalRegistrarRenewalWithReferrer` from `ens-test-env`. `AnyRegistrarControllerABI` now also includes the `UniversalRegistrarRenewalWithReferrer` ABI.

## 1.10.1

## 1.10.0

## 1.9.0

## 1.8.1

## 1.8.0

## 1.7.0

## 1.6.0

### Patch Changes

- [#1516](https://github.com/namehash/ensnode/pull/1516) [`a87b437`](https://github.com/namehash/ensnode/commit/a87b4370ff8b4da6a254dda39afac19e3a7f6e94) Thanks [@shrugs](https://github.com/shrugs)! - Introduces a temporary `sepolia-v2` ENS Namespace, intended for testing of ephemeral ENSv2 deployments to the Sepolia chain. This feature is intended for developers of the ENS protocol, and is highly experimental and should be considered unstable.

## 1.5.1

## 1.5.0

## 1.4.0

### Minor Changes

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - Introduces the ENSv2 Plugin ('ensv2') for indexing both ENSv1 and the future ENSv2 protocol.

- [#1280](https://github.com/namehash/ensnode/pull/1280) [`c254385`](https://github.com/namehash/ensnode/commit/c254385a7f08952b31eff8cdd46c01cb09bed8ec) Thanks [@shrugs](https://github.com/shrugs)! - BREAKING: Removed holesky ENSNamespace.

## 1.3.1

## 1.3.0

## 1.2.0

## 1.1.0

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Minor Changes

- [#1276](https://github.com/namehash/ensnode/pull/1276) [`6be7a18`](https://github.com/namehash/ensnode/commit/6be7a189d0f9ac21d89c01941eb6b5a3cd13f88f) Thanks [@tk-o](https://github.com/tk-o)! - Add `UniversalRegistrarRenewalWithReferrer` datasource to ENSRoot Datasource for `mainnet` and `sepolia` ENSNamespaces.

## 0.36.0

### Minor Changes

- [#1133](https://github.com/namehash/ensnode/pull/1133) [`afbf575`](https://github.com/namehash/ensnode/commit/afbf575d8448446f52ab0da8cbe8f5f2d7da6827) Thanks [@tk-o](https://github.com/tk-o)! - Index `UpgradeableRegistrarController` for Basenames.

- [#1029](https://github.com/namehash/ensnode/pull/1029) [`7fc0465`](https://github.com/namehash/ensnode/commit/7fc0465d3b816affe2930c7f36577d0214d145b9) Thanks [@shrugs](https://github.com/shrugs)! - Update ens-test-env Namespace to support new deterministic ens-test-env ENS protocol deployment.

## 0.35.0

## 0.34.0

### Minor Changes

- [#970](https://github.com/namehash/ensnode/pull/970) [`373e934`](https://github.com/namehash/ensnode/commit/373e9343f7ac14010ae9a995cb812c42210c92e2) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Initial launch of ENS TokenScope with support for indexing Seaport sales.

## 0.33.0

### Minor Changes

- [#927](https://github.com/namehash/ensnode/pull/927) [`748a16e`](https://github.com/namehash/ensnode/commit/748a16e3a74798b21ccf1881dcf36d411ee6a27c) Thanks [@shrugs](https://github.com/shrugs)! - fix type serialization issue that was preventing build

## 0.32.0

### Minor Changes

- [#902](https://github.com/namehash/ensnode/pull/902) [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485) Thanks [@shrugs](https://github.com/shrugs)! - adds ENSIP-19 ReverseResolver datasource and associated contracts

- [#867](https://github.com/namehash/ensnode/pull/867) [`38711f8`](https://github.com/namehash/ensnode/commit/38711f88b327284ce51a9b4a21c39af2192f2e01) Thanks [@shrugs](https://github.com/shrugs)! - rename LegacyEthRegistrarController, WrappedEthRegistrarController, add UnwrappedEthRegistrarController Datasources

- [#740](https://github.com/namehash/ensnode/pull/740) [`3c6378b`](https://github.com/namehash/ensnode/commit/3c6378bd8f1504ed4da724f537dc6869371a40e0) Thanks [@Y3drk](https://github.com/Y3drk)! - Added helper functions to generate block explorer URLs for supported chains.

- [#812](https://github.com/namehash/ensnode/pull/812) [`cad61ef`](https://github.com/namehash/ensnode/commit/cad61efc9984aa1b8b0738e90e29b28a879886a8) Thanks [@Y3drk](https://github.com/Y3drk)! - Added helper functions for generating ENS Manager App URLs

## 0.31.0

## 0.30.0

## 0.29.0

### Minor Changes

- [#818](https://github.com/namehash/ensnode/pull/818) [`2f9f357`](https://github.com/namehash/ensnode/commit/2f9f35780def5a6696263cf2e10d4ec4f89194f5) Thanks [@tk-o](https://github.com/tk-o)! - Update Ponder version to `0.11`.

- [#792](https://github.com/namehash/ensnode/pull/792) [`4ee9eb7`](https://github.com/namehash/ensnode/commit/4ee9eb7bcbdd3ec45704565cc4e5567237ee7238) Thanks [@shrugs](https://github.com/shrugs)! - renamed @ensnode/ens-deployments to @ensnode/datasources

## 0.28.0

### Minor Changes

- [#772](https://github.com/namehash/ensnode/pull/772) [`a41cc26`](https://github.com/namehash/ensnode/commit/a41cc26bbef49768f398780d67e4caeca7b22fb1) Thanks [@NickSneo](https://github.com/NickSneo)! - Enable indexing with Lineanames and Basenames for the `sepolia` ENS Deployment Chain.

### Patch Changes

- [#779](https://github.com/namehash/ensnode/pull/779) [`e30289e`](https://github.com/namehash/ensnode/commit/e30289e5292a991638fd55cc04d663dc97ecb30a) Thanks [@tk-o](https://github.com/tk-o)! - Fix references across monorepo dependencies.

## 0.27.0

## 0.26.0

## 0.25.0

### Minor Changes

- [#657](https://github.com/namehash/ensnode/pull/657) [`edd2b1e`](https://github.com/namehash/ensnode/commit/edd2b1ebb4e052a5036edee090dd05c80cb732ca) Thanks [@shrugs](https://github.com/shrugs)! - added threedns datasources

## 0.24.0

### Minor Changes

- [#662](https://github.com/namehash/ensnode/pull/662) [`ea87355`](https://github.com/namehash/ensnode/commit/ea87355e2893448bf53d586bef436ce20095b66d) Thanks [@shrugs](https://github.com/shrugs)! - update ens-test-env to read from env variables for deployment addresses

## 0.23.0

## 0.22.1

## 0.22.0

## 0.21.0

## 0.20.0

## 0.19.4

## 0.19.3

## 0.19.2

## 0.19.1

## 0.19.0

### Minor Changes

- [#607](https://github.com/namehash/ensnode/pull/607) [`b477584`](https://github.com/namehash/ensnode/commit/b477584c0ab9645214ced764b50224af6a636ffa) Thanks [@shrugs](https://github.com/shrugs)! - Rename root plugin to subgraph

- [#532](https://github.com/namehash/ensnode/pull/532) [`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be) Thanks [@shrugs](https://github.com/shrugs)! - the great naming terminology refactor

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.0

## 0.13.0

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.1.0

### Minor Changes

- 6941f0b: Initial Release
