# ensadmin

## 0.35.0

### Minor Changes

- [#994](https://github.com/namehash/ensnode/pull/994) [`ff9c7a8`](https://github.com/namehash/ensnode/commit/ff9c7a8fd27ec8131330d8e3d1337077510e3d95) Thanks [@shrugs](https://github.com/shrugs)! - Fixes issue where ENSIndexer's configured ENSRainbow Label Set Version Number was rendering as 'unknown' when it was 0.

### Patch Changes

- Updated dependencies [[`7ccaa65`](https://github.com/namehash/ensnode/commit/7ccaa65c5142f0491d7f1882cd84eed7e0d3c8ea)]:
  - @ensnode/ensnode-schema@0.35.0
  - @ensnode/datasources@0.35.0
  - @ensnode/ponder-metadata@0.35.0
  - @ensnode/ensnode-react@0.35.0
  - @ensnode/ensnode-sdk@0.35.0

## 0.34.0

### Minor Changes

- [#981](https://github.com/namehash/ensnode/pull/981) [`21da192`](https://github.com/namehash/ensnode/commit/21da192ff6dc523fd8b2e1b36a0e2b449d6eb3af) Thanks [@notrab](https://github.com/notrab)! - indexer error status badge improvements

- [#983](https://github.com/namehash/ensnode/pull/983) [`5e3d33e`](https://github.com/namehash/ensnode/commit/5e3d33efe2b88e45a765cf7f3910728f503e3e00) Thanks [@notrab](https://github.com/notrab)! - better format datetime for backfill status

- [#924](https://github.com/namehash/ensnode/pull/924) [`2da3215`](https://github.com/namehash/ensnode/commit/2da321500487759f92d158744c53f1fdffe05ba4) Thanks [@shrugs](https://github.com/shrugs)! - Added Resolution API Inspectors w/ Protocol Tracing for Records, Primary Name, and Primary Names endpoints

- [#982](https://github.com/namehash/ensnode/pull/982) [`ad60c8a`](https://github.com/namehash/ensnode/commit/ad60c8a7b795236df2009997857c96a3cdbdc593) Thanks [@notrab](https://github.com/notrab)! - add new and update existing chain icons

- [#919](https://github.com/namehash/ensnode/pull/919) [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa) Thanks [@tk-o](https://github.com/tk-o)! - Integrates new ENSNode APIs: Config API and Indexing Status API. Removes dependency on the legacy ENSNode `/metadata` endpoint.

### Patch Changes

- [#962](https://github.com/namehash/ensnode/pull/962) [`845a037`](https://github.com/namehash/ensnode/commit/845a03761dc830303a56cd70fe0d57c36d78a663) Thanks [@djstrong](https://github.com/djstrong)! - Add label set information display to ENSAdmin status UI

  - Update ENSIndexerDependencyInfo component to display label set details
  - Enhance the configuration and UI representation of ENS indexing status
  - Add mock data support for label set information in status page

- Updated dependencies [[`845a037`](https://github.com/namehash/ensnode/commit/845a03761dc830303a56cd70fe0d57c36d78a663), [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa), [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa), [`373e934`](https://github.com/namehash/ensnode/commit/373e9343f7ac14010ae9a995cb812c42210c92e2)]:
  - @ensnode/ensnode-sdk@0.34.0
  - @ensnode/ensnode-schema@0.34.0
  - @ensnode/datasources@0.34.0
  - @ensnode/ensnode-react@0.34.0
  - @ensnode/ponder-metadata@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [[`748a16e`](https://github.com/namehash/ensnode/commit/748a16e3a74798b21ccf1881dcf36d411ee6a27c)]:
  - @ensnode/datasources@0.33.0
  - @ensnode/ensnode-sdk@0.33.0
  - @ensnode/ensnode-react@2.0.0
  - @ensnode/ponder-metadata@0.33.0
  - @ensnode/ensnode-schema@0.33.0

## 0.32.0

### Minor Changes

- [#915](https://github.com/namehash/ensnode/pull/915) [`79ba4cd`](https://github.com/namehash/ensnode/commit/79ba4cda9f9048c568f4f57b129b0c291e6fd788) Thanks [@shrugs](https://github.com/shrugs)! - integrate new ENSNode React SDK to power primary name resolution

- [#915](https://github.com/namehash/ensnode/pull/915) [`79ba4cd`](https://github.com/namehash/ensnode/commit/79ba4cda9f9048c568f4f57b129b0c291e6fd788) Thanks [@shrugs](https://github.com/shrugs)! - RPC_URLs are no longer required to run ENSAdmin

- [#915](https://github.com/namehash/ensnode/pull/915) [`79ba4cd`](https://github.com/namehash/ensnode/commit/79ba4cda9f9048c568f4f57b129b0c291e6fd788) Thanks [@shrugs](https://github.com/shrugs)! - Support for ens-test-env has been added to ENSAdmin

- [#870](https://github.com/namehash/ensnode/pull/870) [`29176f9`](https://github.com/namehash/ensnode/commit/29176f94e477a96a3dd9f98141cf8235bc135be2) Thanks [@notrab](https://github.com/notrab)! - remove ponder client examples page

### Patch Changes

- [#812](https://github.com/namehash/ensnode/pull/812) [`cad61ef`](https://github.com/namehash/ensnode/commit/cad61efc9984aa1b8b0738e90e29b28a879886a8) Thanks [@Y3drk](https://github.com/Y3drk)! - Fixed support for all ENS namespaces in ENSAdmin

- [#890](https://github.com/namehash/ensnode/pull/890) [`95c9140`](https://github.com/namehash/ensnode/commit/95c91404bd699705602d5ec19e76242b05057a44) Thanks [@djstrong](https://github.com/djstrong)! - Enhance RPC configuration guidance.

- [#740](https://github.com/namehash/ensnode/pull/740) [`3c6378b`](https://github.com/namehash/ensnode/commit/3c6378bd8f1504ed4da724f537dc6869371a40e0) Thanks [@Y3drk](https://github.com/Y3drk)! - Improve 'Indexed Chains' panel's UI

- [#912](https://github.com/namehash/ensnode/pull/912) [`886f8ca`](https://github.com/namehash/ensnode/commit/886f8ca27dfab5302fae4e04a89d1b3fce21cf04) Thanks [@djstrong](https://github.com/djstrong)! - remove deprecated `/ponder` endpoint and update documentation

- Updated dependencies [[`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485), [`2b60fad`](https://github.com/namehash/ensnode/commit/2b60fad313e31735c77372c514d22523f9d2cbc3), [`32ad3d8`](https://github.com/namehash/ensnode/commit/32ad3d8d129c5ce872615819de2fcc0be433a294), [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485), [`38711f8`](https://github.com/namehash/ensnode/commit/38711f88b327284ce51a9b4a21c39af2192f2e01), [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485), [`3c6378b`](https://github.com/namehash/ensnode/commit/3c6378bd8f1504ed4da724f537dc6869371a40e0), [`cad61ef`](https://github.com/namehash/ensnode/commit/cad61efc9984aa1b8b0738e90e29b28a879886a8), [`ad7fc8b`](https://github.com/namehash/ensnode/commit/ad7fc8bb4d12fe0ef1bb133eef9670d4eb84911b), [`ad7fc8b`](https://github.com/namehash/ensnode/commit/ad7fc8bb4d12fe0ef1bb133eef9670d4eb84911b), [`f3eff8a`](https://github.com/namehash/ensnode/commit/f3eff8aef94cf6162ae4bab39059abd1e852352b), [`a769e90`](https://github.com/namehash/ensnode/commit/a769e9028a0dd55b88e62fe90669c5dc54e51485)]:
  - @ensnode/ensnode-schema@0.32.0
  - @ensnode/ensnode-sdk@0.32.0
  - @ensnode/datasources@0.32.0
  - @ensnode/ensnode-react@1.0.0
  - @ensnode/ponder-metadata@0.32.0

## 0.31.0

### Minor Changes

- [#858](https://github.com/namehash/ensnode/pull/858) [`92f77c3`](https://github.com/namehash/ensnode/commit/92f77c3a03c01864519cdc9ad5573d69b766cbe2) Thanks [@notrab](https://github.com/notrab)! - Remove ponder graphql UI and update routes from /gql to /api

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@0.31.0
  - @ensnode/ponder-metadata@0.31.0
  - @ensnode/ensnode-schema@0.31.0
  - @ensnode/ensnode-sdk@0.31.0

## 0.30.0

### Minor Changes

- [#794](https://github.com/namehash/ensnode/pull/794) [`1bc2197`](https://github.com/namehash/ensnode/commit/1bc2197a33c8856ae47878c587b8faaeb817f553) Thanks [@notrab](https://github.com/notrab)! - Enable default query and variable state through query params

### Patch Changes

- Updated dependencies []:
  - @ensnode/datasources@0.30.0
  - @ensnode/ponder-metadata@0.30.0
  - @ensnode/ensnode-schema@0.30.0
  - @ensnode/ensnode-sdk@0.30.0

## 0.29.0

### Minor Changes

- [#792](https://github.com/namehash/ensnode/pull/792) [`4ee9eb7`](https://github.com/namehash/ensnode/commit/4ee9eb7bcbdd3ec45704565cc4e5567237ee7238) Thanks [@shrugs](https://github.com/shrugs)! - rename the ENS_DEPLOYMENT_CHAIN configuration variable to NAMESPACE

- [#780](https://github.com/namehash/ensnode/pull/780) [`3ae7bb1`](https://github.com/namehash/ensnode/commit/3ae7bb118d8a8f0de6a1fc046ca3aeff1a8637b1) Thanks [@djstrong](https://github.com/djstrong)! - add new saved GraphQL queries in ENSAdmin

### Patch Changes

- Updated dependencies [[`2f9f357`](https://github.com/namehash/ensnode/commit/2f9f35780def5a6696263cf2e10d4ec4f89194f5), [`4ee9eb7`](https://github.com/namehash/ensnode/commit/4ee9eb7bcbdd3ec45704565cc4e5567237ee7238), [`fdc6eef`](https://github.com/namehash/ensnode/commit/fdc6eefbf870a8451e40e56de2fb424bfc85ba7f)]:
  - @ensnode/ponder-metadata@0.29.0
  - @ensnode/datasources@0.29.0
  - @ensnode/ensnode-schema@0.29.0
  - @ensnode/ensnode-sdk@0.29.0

## 0.28.0

### Minor Changes

- [#756](https://github.com/namehash/ensnode/pull/756) [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b) Thanks [@tk-o](https://github.com/tk-o)! - Renamed @ensnode/utils to @ensnode/ensnode-sdk.

### Patch Changes

- Updated dependencies [[`a41cc26`](https://github.com/namehash/ensnode/commit/a41cc26bbef49768f398780d67e4caeca7b22fb1), [`e30289e`](https://github.com/namehash/ensnode/commit/e30289e5292a991638fd55cc04d663dc97ecb30a), [`9aeaccd`](https://github.com/namehash/ensnode/commit/9aeaccd1034b970dc3a770a349292e65ba53cd2d), [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b)]:
  - @ensnode/ens-deployments@0.28.0
  - @ensnode/ensnode-sdk@0.28.0
  - @ensnode/ensnode-schema@0.28.0
  - @ensnode/ponder-metadata@0.28.0

## 0.27.0

### Patch Changes

- [#686](https://github.com/namehash/ensnode/pull/686) [`95119d2`](https://github.com/namehash/ensnode/commit/95119d29c6cffd80cf6d628487f0af82087bdc3d) Thanks [@tk-o](https://github.com/tk-o)! - Allow displaying indexing status for chains pending indexing.

- [#709](https://github.com/namehash/ensnode/pull/709) [`53a80a1`](https://github.com/namehash/ensnode/commit/53a80a1893abaa6ad6f30b945c674c41a1f17399) Thanks [@danstarns](https://github.com/danstarns)! - Replace copy-pasted AI query generator functionality with its upstream dependency counter-part.

- Updated dependencies [[`fcea8c1`](https://github.com/namehash/ensnode/commit/fcea8c1fbcc19b3948ecf7d1bef61c38480e8e7d)]:
  - @ensnode/ensnode-schema@0.27.0
  - @ensnode/ens-deployments@0.27.0
  - @ensnode/utils@0.27.0
  - @ensnode/ponder-metadata@0.27.0

## 0.26.0

### Minor Changes

- [#664](https://github.com/namehash/ensnode/pull/664) [`3ac214b`](https://github.com/namehash/ensnode/commit/3ac214b85c092c3dfc22c091a6883cf68f71b8bd) Thanks [@notrab](https://github.com/notrab)! - Improvements to ENSAdmin user experience: introducing "Saved Queries" to GraphQL Editor UI to enable users access useful data quickly from ENSNode.'

### Patch Changes

- [#674](https://github.com/namehash/ensnode/pull/674) [`a00320c`](https://github.com/namehash/ensnode/commit/a00320c6e02a923a1ab65485026a6a9ff9e9d64a) Thanks [@tk-o](https://github.com/tk-o)! - Include Optimism Mainnet configuration to allow proper data display.

- Updated dependencies []:
  - @ensnode/ens-deployments@0.26.0
  - @ensnode/utils@0.26.0
  - @ensnode/ponder-metadata@0.26.0
  - @ensnode/ponder-schema@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.25.0
  - @ensnode/ponder-metadata@0.25.0
  - @ensnode/ponder-schema@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.24.0
  - @ensnode/ponder-metadata@0.24.0
  - @ensnode/ponder-schema@0.24.0

## 0.23.0

### Minor Changes

- [#665](https://github.com/namehash/ensnode/pull/665) [`8b5f360`](https://github.com/namehash/ensnode/commit/8b5f360536bdb1fdf8e958745a70e2e789d1012f) Thanks [@tk-o](https://github.com/tk-o)! - Introducing ai-query-generator integration to ENSAdmin API.

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.23.0
  - @ensnode/ponder-metadata@0.23.0
  - @ensnode/ponder-schema@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [[`8f494c4`](https://github.com/namehash/ensnode/commit/8f494c499ec1693d25d0c033158ac75cfdb88cc5)]:
  - @ensnode/utils@0.22.1
  - @ensnode/ponder-metadata@0.22.1
  - @ensnode/ponder-schema@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.22.0
  - @ensnode/ponder-metadata@0.22.0
  - @ensnode/ponder-schema@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.21.0
  - @ensnode/ponder-metadata@0.21.0
  - @ensnode/ponder-schema@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/utils@0.20.0
  - @ensnode/ponder-metadata@0.20.0
  - @ensnode/ponder-schema@0.20.0

## 0.19.4

### Patch Changes

- Updated dependencies [[`829d50f`](https://github.com/namehash/ensnode/commit/829d50f6b2ea1f49276a8cb614b082c80aea760d)]:
  - @ensnode/utils@0.19.4
  - @ensnode/ponder-metadata@0.19.4
  - @ensnode/ponder-schema@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [[`387c7c2`](https://github.com/namehash/ensnode/commit/387c7c24c5a7e76c2145799962b3537ed000b6c4)]:
  - @ensnode/utils@0.19.3
  - @ensnode/ponder-metadata@0.19.3
  - @ensnode/ponder-schema@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [[`396607e`](https://github.com/namehash/ensnode/commit/396607e08532e22b2367b2b4b1a2962983924e81)]:
  - @ensnode/utils@0.19.2
  - @ensnode/ponder-metadata@0.19.2
  - @ensnode/ponder-schema@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies [[`7ef8b05`](https://github.com/namehash/ensnode/commit/7ef8b0502945339d6cdbf496f1fb26cc7f1d02a2)]:
  - @ensnode/ponder-metadata@0.19.1
  - @ensnode/utils@0.19.1
  - @ensnode/ponder-schema@0.19.1

## 0.19.0

### Minor Changes

- [#532](https://github.com/namehash/ensnode/pull/532) [`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be) Thanks [@shrugs](https://github.com/shrugs)! - the great naming terminology refactor

### Patch Changes

- Updated dependencies [[`7e0c78d`](https://github.com/namehash/ensnode/commit/7e0c78d8218519421b923e84723867e3e0ba76be)]:
  - @ensnode/utils@0.19.0
  - @ensnode/ponder-metadata@0.19.0
  - @ensnode/ponder-schema@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.18.0
  - @ensnode/ponder-schema@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.17.0
  - @ensnode/ponder-schema@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.16.0
  - @ensnode/ponder-schema@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.15.0
  - @ensnode/ponder-schema@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.14.0
  - @ensnode/ponder-schema@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.13.0
  - @ensnode/ponder-schema@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.12.0
  - @ensnode/ponder-schema@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.11.0
  - @ensnode/ponder-schema@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.10.0
  - @ensnode/ponder-schema@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.9.0
  - @ensnode/ponder-schema@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.8.0
  - @ensnode/ponder-schema@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.7.0
  - @ensnode/ponder-schema@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ponder-metadata@0.6.0
  - @ensnode/ponder-schema@0.6.0

## 0.5.0

## 0.4.0

## 0.3.0

## 0.2.0

## 0.1.4

### Patch Changes

- [#481](https://github.com/namehash/ensnode/pull/481) [`7c5f720`](https://github.com/namehash/ensnode/commit/7c5f7206d40f1daf28073c574d4985165bcf0fda) Thanks [@tk-o](https://github.com/tk-o)! - Allow ENSAdmin to validate ENSNode connection more precisely and inform the user about any validation errors.

## 0.1.3

## 0.1.2

### Patch Changes

- [#461](https://github.com/namehash/ensnode/pull/461) [`25680b9`](https://github.com/namehash/ensnode/commit/25680b97f150fac7e7edec8f8ac5e8a0886de2cb) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Grouped apps for single release

## 0.1.1

### Patch Changes

- [#458](https://github.com/namehash/ensnode/pull/458) [`f1d18a9`](https://github.com/namehash/ensnode/commit/f1d18a942187525982771a33fdafb6e3149e2e01) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Tagging logic for core docker images
