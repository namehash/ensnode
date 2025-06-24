# ensindexer

## 0.28.0

### Minor Changes

- [#772](https://github.com/namehash/ensnode/pull/772) [`a41cc26`](https://github.com/namehash/ensnode/commit/a41cc26bbef49768f398780d67e4caeca7b22fb1) Thanks [@NickSneo](https://github.com/NickSneo)! - Enable indexing with Lineanames and Basenames for the `sepolia` ENS Deployment Chain.

- [#750](https://github.com/namehash/ensnode/pull/750) [`48022d6`](https://github.com/namehash/ensnode/commit/48022d6416c0e34453cbca7a35ec69ec722066b8) Thanks [@tk-o](https://github.com/tk-o)! - Heal reverse addresses for events coming from one of the ENS Deployment Chains.

- [#746](https://github.com/namehash/ensnode/pull/746) [`9aeaccd`](https://github.com/namehash/ensnode/commit/9aeaccd1034b970dc3a770a349292e65ba53cd2d) Thanks [@shrugs](https://github.com/shrugs)! - added optional indexAdditionalResolverRecords runtime flag to allow the indexing of additional resolver record values

- [#765](https://github.com/namehash/ensnode/pull/765) [`58fa0b2`](https://github.com/namehash/ensnode/commit/58fa0b2f3ddd0331c24bd470855e1e51fe65394a) Thanks [@tk-o](https://github.com/tk-o)! - Update ENSIndexerConfig to include `ensDeployment` object.

- [#765](https://github.com/namehash/ensnode/pull/765) [`58fa0b2`](https://github.com/namehash/ensnode/commit/58fa0b2f3ddd0331c24bd470855e1e51fe65394a) Thanks [@tk-o](https://github.com/tk-o)! - Set concrete types for each of the plugins.

- [#756](https://github.com/namehash/ensnode/pull/756) [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b) Thanks [@tk-o](https://github.com/tk-o)! - Renamed @ensnode/utils to @ensnode/ensnode-sdk.

### Patch Changes

- Updated dependencies [[`a41cc26`](https://github.com/namehash/ensnode/commit/a41cc26bbef49768f398780d67e4caeca7b22fb1), [`e30289e`](https://github.com/namehash/ensnode/commit/e30289e5292a991638fd55cc04d663dc97ecb30a), [`9aeaccd`](https://github.com/namehash/ensnode/commit/9aeaccd1034b970dc3a770a349292e65ba53cd2d), [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b)]:
  - @ensnode/ens-deployments@0.28.0
  - @ensnode/ensnode-sdk@0.28.0
  - @ensnode/ensnode-schema@0.28.0
  - @ensnode/ensrainbow-sdk@0.28.0
  - @ensnode/ponder-metadata@0.28.0
  - @ensnode/ponder-subgraph@0.28.0

## 0.27.0

### Minor Changes

- [#705](https://github.com/namehash/ensnode/pull/705) [`ec1d761`](https://github.com/namehash/ensnode/commit/ec1d761a78abd8f7fb5a5fd3d1e513f2244d5a73) Thanks [@shrugs](https://github.com/shrugs)! - Resolver ids are now chain-scoped for non-subgraph plugins to avoid collisions between resolver contracts with the same address on multiple chains

- [#697](https://github.com/namehash/ensnode/pull/697) [`fb5b138`](https://github.com/namehash/ensnode/commit/fb5b13830c051b43bce7731ad147d7c25908ab34) Thanks [@shrugs](https://github.com/shrugs)! - ThreeDNS plugin now correctly supports TXT records and implicit resolver association

- [#715](https://github.com/namehash/ensnode/pull/715) [`702721b`](https://github.com/namehash/ensnode/commit/702721be4645f8a9d4b3be0fc32b090ca94078a3) Thanks [@shrugs](https://github.com/shrugs)! - more exhaustively document basenames premint patch behavior

- [#717](https://github.com/namehash/ensnode/pull/717) [`ec7f117`](https://github.com/namehash/ensnode/commit/ec7f117fa6a464b78a3b67d6dfab86b16f9240e2) Thanks [@shrugs](https://github.com/shrugs)! - update ponder dependencies to 0.10.26

- [#707](https://github.com/namehash/ensnode/pull/707) [`7df65bd`](https://github.com/namehash/ensnode/commit/7df65bd7d69f21762d0817054d4f1dac4a905e95) Thanks [@shrugs](https://github.com/shrugs)! - subdomainCount field for basenames and lineanames domains is now accurate

- [#719](https://github.com/namehash/ensnode/pull/719) [`cde4bae`](https://github.com/namehash/ensnode/commit/cde4baeb137bba8549b44eadb2dc9a3d8b3c894b) Thanks [@shrugs](https://github.com/shrugs)! - now explicitly strips null bytes from resolver text values rather than relying on ponder's default behavior

- [#698](https://github.com/namehash/ensnode/pull/698) [`86f9f0a`](https://github.com/namehash/ensnode/commit/86f9f0a82c59a19d6a153d28f7ae601466df0a8c) Thanks [@0xBison](https://github.com/0xBison)! - centralized indexer config with zod validations

- [#703](https://github.com/namehash/ensnode/pull/703) [`db9fc86`](https://github.com/namehash/ensnode/commit/db9fc86d3a5c4af1d4ec81ac810179f3bdc1b326) Thanks [@0xBison](https://github.com/0xBison)! - use default port if one isn't specified

### Patch Changes

- [#713](https://github.com/namehash/ensnode/pull/713) [`e44e8c6`](https://github.com/namehash/ensnode/commit/e44e8c6b89cca569393a016bee76a8894a8362db) Thanks [@tk-o](https://github.com/tk-o)! - Use transaction sender address for healing label from reverse registry.

- [#749](https://github.com/namehash/ensnode/pull/749) [`7f68c87`](https://github.com/namehash/ensnode/commit/7f68c87f71107efc58ba0554c1cd9f2c3d2a4238) Thanks [@tk-o](https://github.com/tk-o)! - Fix config runtime error when running indexing for other ENS Deployment Chains than `mainnet`.

- Updated dependencies [[`33c46ae`](https://github.com/namehash/ensnode/commit/33c46aef7e452daafef189ec9fef7d16ce8ceecb), [`fcea8c1`](https://github.com/namehash/ensnode/commit/fcea8c1fbcc19b3948ecf7d1bef61c38480e8e7d)]:
  - @ensnode/ponder-subgraph@0.27.0
  - @ensnode/ensnode-schema@0.27.0
  - @ensnode/ens-deployments@0.27.0
  - @ensnode/utils@0.27.0
  - @ensnode/ensrainbow-sdk@0.27.0
  - @ensnode/ponder-metadata@0.27.0

## 0.26.0

### Minor Changes

- [#679](https://github.com/namehash/ensnode/pull/679) [`04d224c`](https://github.com/namehash/ensnode/commit/04d224c21a55ad723116ef64cb961a54deb6313e) Thanks [@shrugs](https://github.com/shrugs)! - fix issue where rpc endpoints for all plugins were required at runtime

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.26.0
  - @ensnode/utils@0.26.0
  - @ensnode/ensrainbow-sdk@0.26.0
  - @ensnode/ponder-metadata@0.26.0
  - @ensnode/ponder-schema@0.26.0
  - @ensnode/ponder-subgraph@0.26.0

## 0.25.0

### Minor Changes

- [#657](https://github.com/namehash/ensnode/pull/657) [`edd2b1e`](https://github.com/namehash/ensnode/commit/edd2b1ebb4e052a5036edee090dd05c80cb732ca) Thanks [@shrugs](https://github.com/shrugs)! - refactored resolver logic to use ponder multi-network behavior rather than per-plugin

- [#657](https://github.com/namehash/ensnode/pull/657) [`edd2b1e`](https://github.com/namehash/ensnode/commit/edd2b1ebb4e052a5036edee090dd05c80cb732ca) Thanks [@shrugs](https://github.com/shrugs)! - implemented threedns indexer for base and optimism datasources with name healing from HybridMetadataService

### Patch Changes

- Updated dependencies [[`edd2b1e`](https://github.com/namehash/ensnode/commit/edd2b1ebb4e052a5036edee090dd05c80cb732ca)]:
  - @ensnode/ens-deployments@0.25.0
  - @ensnode/utils@0.25.0
  - @ensnode/ensrainbow-sdk@0.25.0
  - @ensnode/ponder-metadata@0.25.0
  - @ensnode/ponder-schema@0.25.0
  - @ensnode/ponder-subgraph@0.25.0

## 0.24.0

### Minor Changes

- [#611](https://github.com/namehash/ensnode/pull/611) [`fe51446`](https://github.com/namehash/ensnode/commit/fe51446c9ffc5359f29dcd74419899c0b74d6fcb) Thanks [@shrugs](https://github.com/shrugs)! - update ponder to latest, not backwards compatible with previous version

### Patch Changes

- Updated dependencies [[`ea87355`](https://github.com/namehash/ensnode/commit/ea87355e2893448bf53d586bef436ce20095b66d)]:
  - @ensnode/ens-deployments@0.24.0
  - @ensnode/utils@0.24.0
  - @ensnode/ensrainbow-sdk@0.24.0
  - @ensnode/ponder-metadata@0.24.0
  - @ensnode/ponder-schema@0.24.0
  - @ensnode/ponder-subgraph@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.23.0
  - @ensnode/utils@0.23.0
  - @ensnode/ensrainbow-sdk@0.23.0
  - @ensnode/ponder-metadata@0.23.0
  - @ensnode/ponder-schema@0.23.0
  - @ensnode/ponder-subgraph@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [[`8f494c4`](https://github.com/namehash/ensnode/commit/8f494c499ec1693d25d0c033158ac75cfdb88cc5)]:
  - @ensnode/utils@0.22.1
  - @ensnode/ensrainbow-sdk@0.22.1
  - @ensnode/ens-deployments@0.22.1
  - @ensnode/ponder-metadata@0.22.1
  - @ensnode/ponder-schema@0.22.1
  - @ensnode/ponder-subgraph@0.22.1

## 0.22.0

### Minor Changes

- [#639](https://github.com/namehash/ensnode/pull/639) [`0115784`](https://github.com/namehash/ensnode/commit/0115784f15bb775f0e0dc6dd197376724cb37add) Thanks [@shrugs](https://github.com/shrugs)! - fix private package tagging

- [#640](https://github.com/namehash/ensnode/pull/640) [`e4ab45b`](https://github.com/namehash/ensnode/commit/e4ab45bd3ef3fa6e8071393f625eaf5e615b5a0b) Thanks [@shrugs](https://github.com/shrugs)! - fix changeset publish once again

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.22.0
  - @ensnode/utils@0.22.0
  - @ensnode/ensrainbow-sdk@0.22.0
  - @ensnode/ponder-metadata@0.22.0
  - @ensnode/ponder-schema@0.22.0
  - @ensnode/ponder-subgraph@0.22.0

## 0.21.0

### Minor Changes

- [#637](https://github.com/namehash/ensnode/pull/637) [`ca1222b`](https://github.com/namehash/ensnode/commit/ca1222b6a63e25108081d0120b6ad28f4454bf60) Thanks [@shrugs](https://github.com/shrugs)! - fix changeset publish

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.21.0
  - @ensnode/utils@0.21.0
  - @ensnode/ensrainbow-sdk@0.21.0
  - @ensnode/ponder-metadata@0.21.0
  - @ensnode/ponder-schema@0.21.0
  - @ensnode/ponder-subgraph@0.21.0

## 0.20.0

### Minor Changes

- [#635](https://github.com/namehash/ensnode/pull/635) [`6dd9699`](https://github.com/namehash/ensnode/commit/6dd969915cd74350af3b68fb88e12ebdefc56dfb) Thanks [@shrugs](https://github.com/shrugs)! - fix issue with selecting schema name other than 'public'

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.20.0
  - @ensnode/utils@0.20.0
  - @ensnode/ensrainbow-sdk@0.20.0
  - @ensnode/ponder-metadata@0.20.0
  - @ensnode/ponder-schema@0.20.0
  - @ensnode/ponder-subgraph@0.20.0

## 0.19.4

### Patch Changes

- Updated dependencies [[`829d50f`](https://github.com/namehash/ensnode/commit/829d50f6b2ea1f49276a8cb614b082c80aea760d)]:
  - @ensnode/utils@0.19.4
  - @ensnode/ensrainbow-sdk@0.19.4
  - @ensnode/ens-deployments@0.19.4
  - @ensnode/ponder-metadata@0.19.4
  - @ensnode/ponder-schema@0.19.4
  - @ensnode/ponder-subgraph@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [[`387c7c2`](https://github.com/namehash/ensnode/commit/387c7c24c5a7e76c2145799962b3537ed000b6c4)]:
  - @ensnode/utils@0.19.3
  - @ensnode/ensrainbow-sdk@0.19.3
  - @ensnode/ens-deployments@0.19.3
  - @ensnode/ponder-metadata@0.19.3
  - @ensnode/ponder-schema@0.19.3
  - @ensnode/ponder-subgraph@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [[`396607e`](https://github.com/namehash/ensnode/commit/396607e08532e22b2367b2b4b1a2962983924e81)]:
  - @ensnode/utils@0.19.2
  - @ensnode/ensrainbow-sdk@0.19.2
  - @ensnode/ens-deployments@0.19.2
  - @ensnode/ponder-metadata@0.19.2
  - @ensnode/ponder-schema@0.19.2
  - @ensnode/ponder-subgraph@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies [[`7ef8b05`](https://github.com/namehash/ensnode/commit/7ef8b0502945339d6cdbf496f1fb26cc7f1d02a2)]:
  - @ensnode/ponder-metadata@0.19.1
  - @ensnode/ens-deployments@0.19.1
  - @ensnode/utils@0.19.1
  - @ensnode/ensrainbow-sdk@0.19.1
  - @ensnode/ponder-schema@0.19.1
  - @ensnode/ponder-subgraph@0.19.1

## 0.19.0

### Minor Changes

- [#607](https://github.com/namehash/ensnode/pull/607) [`b477584`](https://github.com/namehash/ensnode/commit/b477584c0ab9645214ced764b50224af6a636ffa) Thanks [@shrugs](https://github.com/shrugs)! - Rename root plugin to subgraph

- [#532](https://github.com/namehash/ensnode/pull/532) [`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be) Thanks [@shrugs](https://github.com/shrugs)! - the great naming terminology refactor

### Patch Changes

- Updated dependencies [[`b477584`](https://github.com/namehash/ensnode/commit/b477584c0ab9645214ced764b50224af6a636ffa), [`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be)]:
  - @ensnode/ens-deployments@0.19.0
  - @ensnode/ensrainbow-sdk@0.19.0
  - @ensnode/utils@0.19.0
  - @ensnode/ponder-metadata@0.19.0
  - @ensnode/ponder-schema@0.19.0
  - @ensnode/ponder-subgraph@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.18.0
  - @ensnode/utils@0.18.0
  - @ensnode/ensrainbow-sdk@0.18.0
  - @ensnode/ponder-metadata@0.18.0
  - @ensnode/ponder-schema@0.18.0
  - @ensnode/ponder-subgraph@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.17.0
  - @ensnode/utils@0.17.0
  - @ensnode/ensrainbow-sdk@0.17.0
  - @ensnode/ponder-metadata@0.17.0
  - @ensnode/ponder-schema@0.17.0
  - @ensnode/ponder-subgraph@0.17.0

## 0.16.0

### Minor Changes

- [#591](https://github.com/namehash/ensnode/pull/591) [`b18ee8d`](https://github.com/namehash/ensnode/commit/b18ee8d18e7139d17bae3952a4db8643f6c48c78) Thanks [@shrugs](https://github.com/shrugs)! - use correct matrix format for builds

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.16.0
  - @ensnode/utils@0.16.0
  - @ensnode/ensrainbow-sdk@0.16.0
  - @ensnode/ponder-metadata@0.16.0
  - @ensnode/ponder-schema@0.16.0
  - @ensnode/ponder-subgraph@0.16.0

## 0.15.0

### Minor Changes

- [#590](https://github.com/namehash/ensnode/pull/590) [`b5c352b`](https://github.com/namehash/ensnode/commit/b5c352badd5cecfc85e5674de18e1df251d027a9) Thanks [@shrugs](https://github.com/shrugs)! - build docker images during release

- [#588](https://github.com/namehash/ensnode/pull/588) [`298f8d4`](https://github.com/namehash/ensnode/commit/298f8d4039e93b735bdf7cb43634920a62cdccec) Thanks [@shrugs](https://github.com/shrugs)! - simpler docker version tag parsing

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.15.0
  - @ensnode/utils@0.15.0
  - @ensnode/ensrainbow-sdk@0.15.0
  - @ensnode/ponder-metadata@0.15.0
  - @ensnode/ponder-schema@0.15.0
  - @ensnode/ponder-subgraph@0.15.0

## 0.14.0

### Minor Changes

- [#586](https://github.com/namehash/ensnode/pull/586) [`1208538`](https://github.com/namehash/ensnode/commit/12085388856e478e5de42a1ce0c891e1b9d37824) Thanks [@shrugs](https://github.com/shrugs)! - try parsing docker tags for workflow

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.14.0
  - @ensnode/utils@0.14.0
  - @ensnode/ensrainbow-sdk@0.14.0
  - @ensnode/ponder-metadata@0.14.0
  - @ensnode/ponder-schema@0.14.0
  - @ensnode/ponder-subgraph@0.14.0

## 0.13.0

### Minor Changes

- [#584](https://github.com/namehash/ensnode/pull/584) [`40b5261`](https://github.com/namehash/ensnode/commit/40b526193357f4dd8f783426512c982a6c314e3d) Thanks [@shrugs](https://github.com/shrugs)! - test

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.13.0
  - @ensnode/utils@0.13.0
  - @ensnode/ensrainbow-sdk@0.13.0
  - @ensnode/ponder-metadata@0.13.0
  - @ensnode/ponder-schema@0.13.0
  - @ensnode/ponder-subgraph@0.13.0

## 0.12.0

### Minor Changes

- [#582](https://github.com/namehash/ensnode/pull/582) [`ba3b29b`](https://github.com/namehash/ensnode/commit/ba3b29b3dc32bd427057dee502c3eebe4b1d1515) Thanks [@shrugs](https://github.com/shrugs)! - test bump

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.12.0
  - @ensnode/utils@0.12.0
  - @ensnode/ensrainbow-sdk@0.12.0
  - @ensnode/ponder-metadata@0.12.0
  - @ensnode/ponder-schema@0.12.0
  - @ensnode/ponder-subgraph@0.12.0

## 0.11.0

### Minor Changes

- [#580](https://github.com/namehash/ensnode/pull/580) [`d6163ba`](https://github.com/namehash/ensnode/commit/d6163ba1a3d38ecdf7639ba2d86b44f29fdfe3e6) Thanks [@shrugs](https://github.com/shrugs)! - test bump

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.11.0
  - @ensnode/utils@0.11.0
  - @ensnode/ensrainbow-sdk@0.11.0
  - @ensnode/ponder-metadata@0.11.0
  - @ensnode/ponder-schema@0.11.0
  - @ensnode/ponder-subgraph@0.11.0

## 0.10.0

### Minor Changes

- [#578](https://github.com/namehash/ensnode/pull/578) [`ef067c4`](https://github.com/namehash/ensnode/commit/ef067c4011ef1fca34c070c100e50dff07bd3c21) Thanks [@shrugs](https://github.com/shrugs)! - another test bump

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.10.0
  - @ensnode/utils@0.10.0
  - @ensnode/ensrainbow-sdk@0.10.0
  - @ensnode/ponder-metadata@0.10.0
  - @ensnode/ponder-schema@0.10.0
  - @ensnode/ponder-subgraph@0.10.0

## 0.9.0

### Minor Changes

- [#576](https://github.com/namehash/ensnode/pull/576) [`4792fca`](https://github.com/namehash/ensnode/commit/4792fca3ec076c9128dc2f301e33b88b9d9149dc) Thanks [@shrugs](https://github.com/shrugs)! - test bump please ignore

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.9.0
  - @ensnode/utils@0.9.0
  - @ensnode/ensrainbow-sdk@0.9.0
  - @ensnode/ponder-metadata@0.9.0
  - @ensnode/ponder-schema@0.9.0
  - @ensnode/ponder-subgraph@0.9.0

## 0.8.0

### Minor Changes

- [#574](https://github.com/namehash/ensnode/pull/574) [`01530de`](https://github.com/namehash/ensnode/commit/01530de6f9fe9629be9efe6498fa3e64d9c0be78) Thanks [@shrugs](https://github.com/shrugs)! - test bump please ignore

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.8.0
  - @ensnode/utils@0.8.0
  - @ensnode/ensrainbow-sdk@0.8.0
  - @ensnode/ponder-metadata@0.8.0
  - @ensnode/ponder-schema@0.8.0
  - @ensnode/ponder-subgraph@0.8.0

## 0.7.0

### Minor Changes

- [#569](https://github.com/namehash/ensnode/pull/569) [`a5dee9b`](https://github.com/namehash/ensnode/commit/a5dee9b27f6953d0367f36dee1dab4cd1fccabb7) Thanks [@shrugs](https://github.com/shrugs)! - test bump

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.7.0
  - @ensnode/utils@0.7.0
  - @ensnode/ensrainbow-sdk@0.7.0
  - @ensnode/ponder-metadata@0.7.0
  - @ensnode/ponder-schema@0.7.0
  - @ensnode/ponder-subgraph@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ens-deployments@0.6.0
  - @ensnode/utils@0.6.0
  - @ensnode/ensrainbow-sdk@0.6.0
  - @ensnode/ponder-metadata@0.6.0
  - @ensnode/ponder-schema@0.6.0
  - @ensnode/ponder-subgraph@0.6.0

## 0.5.0

### Minor Changes

- [#564](https://github.com/namehash/ensnode/pull/564) [`d528b53`](https://github.com/namehash/ensnode/commit/d528b538dddb4751e6b4fe3944789079dc94d328) Thanks [@shrugs](https://github.com/shrugs)! - bump minor

- [#563](https://github.com/namehash/ensnode/pull/563) [`26fac83`](https://github.com/namehash/ensnode/commit/26fac83425194c1a267e58e32a207d70aee991bc) Thanks [@shrugs](https://github.com/shrugs)! - idk man please just work

## 0.4.0

### Minor Changes

- [#553](https://github.com/namehash/ensnode/pull/553) [`2a3d1e6`](https://github.com/namehash/ensnode/commit/2a3d1e6cc74994072cd6afcf081bc58d22dbec7e) Thanks [@shrugs](https://github.com/shrugs)! - test version bump

- [#555](https://github.com/namehash/ensnode/pull/555) [`3c3b091`](https://github.com/namehash/ensnode/commit/3c3b09134f83c636bb921cf883dda28cfe187f2b) Thanks [@shrugs](https://github.com/shrugs)! - test release please ignore

## 0.3.0

### Minor Changes

- [#549](https://github.com/namehash/ensnode/pull/549) [`7c62c92`](https://github.com/namehash/ensnode/commit/7c62c9258de0914db41ce43d4f516a2e1c4c8628) Thanks [@shrugs](https://github.com/shrugs)! - test version bump

## 0.2.0

### Minor Changes

- [#362](https://github.com/namehash/ensnode/pull/362) [`afbc730`](https://github.com/namehash/ensnode/commit/afbc730ff98d72b8118df0d2e7712429f23b8747) Thanks [@tk-o](https://github.com/tk-o)! - ENSIndexer gains ability to heal labels based on reverse addresses.

### Patch Changes

- [#500](https://github.com/namehash/ensnode/pull/500) [`7122325`](https://github.com/namehash/ensnode/commit/71223254dd8b858b37e7c6e25e128e72c28fa2db) Thanks [@BanaSeba](https://github.com/BanaSeba)! - CI/CD patch

- Updated dependencies [[`afbc730`](https://github.com/namehash/ensnode/commit/afbc730ff98d72b8118df0d2e7712429f23b8747)]:
  - @ensnode/utils@0.2.0
  - @ensnode/ensrainbow-sdk@0.1.0

## 0.1.4

## 0.1.3

### Patch Changes

- [#470](https://github.com/namehash/ensnode/pull/470) [`8ab269a`](https://github.com/namehash/ensnode/commit/8ab269a38aa6e0d3afcd1d3dfff0e4c85cfcd854) Thanks [@BanaSeba](https://github.com/BanaSeba)! - CI adjustemnt for changeset releases

## 0.1.2

### Patch Changes

- [#461](https://github.com/namehash/ensnode/pull/461) [`25680b9`](https://github.com/namehash/ensnode/commit/25680b97f150fac7e7edec8f8ac5e8a0886de2cb) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Grouped apps for single release

## 0.0.3

### Patch Changes

- [#458](https://github.com/namehash/ensnode/pull/458) [`f1d18a9`](https://github.com/namehash/ensnode/commit/f1d18a942187525982771a33fdafb6e3149e2e01) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Tagging logic for core docker images

## 0.0.2

### Patch Changes

- [#453](https://github.com/namehash/ensnode/pull/453) [`2ba20d0`](https://github.com/namehash/ensnode/commit/2ba20d01c7d752c8eb2dd0577d1597e4b65a9aac) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Changesets integration
