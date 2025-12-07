# ensadmin

## 1.2.0

### Patch Changes

- [#1340](https://github.com/namehash/ensnode/pull/1340) [`ee6ce70`](https://github.com/namehash/ensnode/commit/ee6ce70b02f347ba7768dc68cd48caadda2ad217) Thanks [@tk-o](https://github.com/tk-o)! - Fix relative time values display on "Latest indexed registrar actions" view.

- Updated dependencies [[`97e4545`](https://github.com/namehash/ensnode/commit/97e4545c70d8c7469f4bd566b91277fdb0c3a699), [`976e284`](https://github.com/namehash/ensnode/commit/976e2842f2e25ff0844471de48a34659b136b5be), [`e35600f`](https://github.com/namehash/ensnode/commit/e35600fe9808f3c72960429b2a56a7f22893bff6), [`4cee4ba`](https://github.com/namehash/ensnode/commit/4cee4ba538e5655ca1e8b75f4d72738f3413c9d3)]:
  - @ensnode/ensnode-sdk@1.2.0
  - @ensnode/ensnode-react@1.2.0
  - @ensnode/datasources@1.2.0
  - @ensnode/ponder-metadata@1.2.0
  - @ensnode/ensnode-schema@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies [[`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582), [`3126ac7`](https://github.com/namehash/ensnode/commit/3126ac744806a4994cf276e41963af38ebfae582)]:
  - @ensnode/ensnode-sdk@1.1.0
  - @ensnode/ensnode-react@1.1.0
  - @ensnode/datasources@1.1.0
  - @ensnode/ponder-metadata@1.1.0
  - @ensnode/ensnode-schema@1.1.0

## 1.0.3

### Patch Changes

- Updated dependencies [[`4faad0b`](https://github.com/namehash/ensnode/commit/4faad0b534c5bbdfdeca4227565fe24ff29c3dd4)]:
  - @ensnode/ensnode-sdk@1.0.3
  - @ensnode/ensnode-react@1.0.3
  - @ensnode/datasources@1.0.3
  - @ensnode/ponder-metadata@1.0.3
  - @ensnode/ensnode-schema@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [[`f6aeb17`](https://github.com/namehash/ensnode/commit/f6aeb17330da0f73ee337a2f94a02cabbab6613e)]:
  - @ensnode/ensnode-sdk@1.0.2
  - @ensnode/ensnode-react@1.0.2
  - @ensnode/datasources@1.0.2
  - @ensnode/ponder-metadata@1.0.2
  - @ensnode/ensnode-schema@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`1609f2a`](https://github.com/namehash/ensnode/commit/1609f2a47a3e40ccf4b80c182dc626fb2331c745)]:
  - @ensnode/ensnode-react@1.0.1
  - @ensnode/datasources@1.0.1
  - @ensnode/ponder-metadata@1.0.1
  - @ensnode/ensnode-schema@1.0.1
  - @ensnode/ensnode-sdk@1.0.1

## 1.0.0

### Minor Changes

- [#1216](https://github.com/namehash/ensnode/pull/1216) [`c72919a`](https://github.com/namehash/ensnode/commit/c72919a9411a32486b40b34cc951af11d54b9fc9) Thanks [@notrab](https://github.com/notrab)! - Resolved stability issue that could cause the browser to crash when refreshing pages in ENSAdmin

- [#1190](https://github.com/namehash/ensnode/pull/1190) [`b9a988c`](https://github.com/namehash/ensnode/commit/b9a988ced492bafe9845fd4524d137cfb0191d2a) Thanks [@notrab](https://github.com/notrab)! - Transitioned explore name detail page to use query param instead of path
  Replace `useENSAppProfileUrl` hook with pure `buildExternalEnsAppProfileUrl` function for better testability and explicit dependency handling.

- [#1207](https://github.com/namehash/ensnode/pull/1207) [`61b9472`](https://github.com/namehash/ensnode/commit/61b94721aee0d7050ebc3e384d5c8e2cd65cc08d) Thanks [@notrab](https://github.com/notrab)! - Transition ENSAdmin to a fast, modern Single Page App built with Next.js

- [#1272](https://github.com/namehash/ensnode/pull/1272) [`25a40ba`](https://github.com/namehash/ensnode/commit/25a40ba8517681ac09e3c823f63c197e8758fe41) Thanks [@tk-o](https://github.com/tk-o)! - Integrated Registrar Actions API for the Registrar Actions UI.

- [#1191](https://github.com/namehash/ensnode/pull/1191) [`0090558`](https://github.com/namehash/ensnode/commit/0090558074a585e5591427db54273438919e0216) Thanks [@notrab](https://github.com/notrab)! - Add initial splash screen and remove /connection root redirect

- [#1282](https://github.com/namehash/ensnode/pull/1282) [`4611fed`](https://github.com/namehash/ensnode/commit/4611fedfff6c7fb67c286887a1e909b0f0d7ec12) Thanks [@tk-o](https://github.com/tk-o)! - Applies `useIndexingStatusWithSwr` hook to present a cached Indexing Status with response code OK.

- [#1261](https://github.com/namehash/ensnode/pull/1261) [`703a12e`](https://github.com/namehash/ensnode/commit/703a12ed307e98ec1c1ce5911b45905ebcad58d8) Thanks [@notrab](https://github.com/notrab)! - Refactored `ConfigInfoAppCard` to use a composable children-based API, converting all components (ENSApi, ENSDb, ENSIndexer, ENSRainbow, and Connection) to use the new `<ConfigInfoItems>`, `<ConfigInfoItem>`, `<ConfigInfoFeatures>`, and `<ConfigInfoFeature>` components for better flexibility and styling control.

- [#1201](https://github.com/namehash/ensnode/pull/1201) [`ceef81e`](https://github.com/namehash/ensnode/commit/ceef81e4a39125b238ab71bb4e0598a1a0771d15) Thanks [@notrab](https://github.com/notrab)! - - Improved ENSNode config info components with better reusability and maintainability (great for mocking too). Introduced `ENSNodeConfigCardDisplay` component that accepts props and extracted a reusable `ENSNodeCard` wrapper that provides consistent header and loading states.

  - Added Suspense boundary around `ConnectionsLibraryProvider` in root layout to better handle hydration
  - Added Suspense boundary with skeleton fallback in `LayoutWrapper` to show proper loading states
  - Ensures all pages remain statically generated while respecting existing component loading states

- [#1211](https://github.com/namehash/ensnode/pull/1211) [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5) Thanks [@shrugs](https://github.com/shrugs)! - ENSAdmin now supports ENSApi Version info.

- [#1291](https://github.com/namehash/ensnode/pull/1291) [`485b373`](https://github.com/namehash/ensnode/commit/485b3732be1fddfb817c7a847984c4c71bb3fe6a) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Accelerate identity lookups within the "Latest indexed registrar actions"

- [#1179](https://github.com/namehash/ensnode/pull/1179) [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `BlockRefViewModel` type with `BlockRef` type from ENSNode SDK package.

- [#1211](https://github.com/namehash/ensnode/pull/1211) [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5) Thanks [@shrugs](https://github.com/shrugs)! - ENSAdmin now displays whether ENSNode attempted acceleration for an acceleratable endpoint in the Protocol Inspector.

- [#1184](https://github.com/namehash/ensnode/pull/1184) [`dc468d1`](https://github.com/namehash/ensnode/commit/dc468d11056fe5b323d1345ce0d97011e8ddb838) Thanks [@notrab](https://github.com/notrab)! - Temporarily disable AI query generator inside GraphiQL until we transition it into the new ENSApi service.

### Patch Changes

- Updated dependencies [[`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`61b9472`](https://github.com/namehash/ensnode/commit/61b94721aee0d7050ebc3e384d5c8e2cd65cc08d), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`4611fed`](https://github.com/namehash/ensnode/commit/4611fedfff6c7fb67c286887a1e909b0f0d7ec12), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a), [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d), [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`25a40ba`](https://github.com/namehash/ensnode/commit/25a40ba8517681ac09e3c823f63c197e8758fe41), [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286), [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114), [`6be7a18`](https://github.com/namehash/ensnode/commit/6be7a189d0f9ac21d89c01941eb6b5a3cd13f88f), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5)]:
  - @ensnode/ensnode-sdk@1.0.0
  - @ensnode/ensnode-react@1.0.0
  - @ensnode/ensnode-schema@1.0.0
  - @ensnode/datasources@1.0.0
  - @ensnode/ponder-metadata@1.0.0

## 0.36.0

### Minor Changes

- [#1015](https://github.com/namehash/ensnode/pull/1015) [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9) Thanks [@tk-o](https://github.com/tk-o)! - Rename chain indexing status from `Unstarted` to `Queued`.

- [#1024](https://github.com/namehash/ensnode/pull/1024) [`083cc3c`](https://github.com/namehash/ensnode/commit/083cc3cb1f7178e112d740427a864af54dee5722) Thanks [@notrab](https://github.com/notrab)! - Initial Name Detail Page

- [#1098](https://github.com/namehash/ensnode/pull/1098) [`d2e6647`](https://github.com/namehash/ensnode/commit/d2e66472cfb7962c3bfe355c9c1587e3e50f2c9d) Thanks [@notrab](https://github.com/notrab)! - Renamed NEXT_PUBLIC_SERVER_ENSNODE_URLS to NEXT_PUBLIC_SERVER_CONNECTION_LIBRARY
  Removed `/connect` page
  Added `connection` url parameter to manage the selected connection URL
  Added hooks for `useSelectedConnection` and `useRawConnectionUrlParam` for use with the connection url parameter
  Refactored the add connection dialog into its own component
  Refactored connection list into its own component to handle server and user provided connection URLs

- [#1074](https://github.com/namehash/ensnode/pull/1074) [`e4d3ce3`](https://github.com/namehash/ensnode/commit/e4d3ce3d9659430a8f0597a4c719ad1993342eaf) Thanks [@tk-o](https://github.com/tk-o)! - Display all `Address` values as checksummed EVM addresses.

- [#1095](https://github.com/namehash/ensnode/pull/1095) [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09) Thanks [@tk-o](https://github.com/tk-o)! - Implement refined Indexing Status API data model.

- [#1039](https://github.com/namehash/ensnode/pull/1039) [`6142f8c`](https://github.com/namehash/ensnode/commit/6142f8c9b8dbc90f37cf5f8dec3bcd18d6d029ae) Thanks [@BanaSeba](https://github.com/BanaSeba)! - Extend default ENSAdmin ENSNode urls

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Update latest indexed registrations panel to tailor ENSIP-19 primary name lookups using a heuristic chainId guess (full solution requires indexed data model enhancement).

- [#1157](https://github.com/namehash/ensnode/pull/1157) [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d) Thanks [@tk-o](https://github.com/tk-o)! - Present all entries from `ENSIndexerVersionInfo` in the UI.

- [#1072](https://github.com/namehash/ensnode/pull/1072) [`89da0a3`](https://github.com/namehash/ensnode/commit/89da0a361bc41678abc6bf3eb729600fc9fd4e50) Thanks [@Y3drk](https://github.com/Y3drk)! - Refine `/status` dashboards UI & UX

- [#1062](https://github.com/namehash/ensnode/pull/1062) [`ec79ed8`](https://github.com/namehash/ensnode/commit/ec79ed888aaac1e05626e1a706067b6334969f4a) Thanks [@Y3drk](https://github.com/Y3drk)! - Refine Indexing Status UI

- [#1071](https://github.com/namehash/ensnode/pull/1071) [`58149fa`](https://github.com/namehash/ensnode/commit/58149fa36caa74e1979b142f91b1b3f9825bd0ba) Thanks [@notrab](https://github.com/notrab)! - Add support for telegram, linkedin and reddit profiles on name detail page

- [#1073](https://github.com/namehash/ensnode/pull/1073) [`feaf593`](https://github.com/namehash/ensnode/commit/feaf593dec3024f5b3a945ed2549bfecd9cc32de) Thanks [@notrab](https://github.com/notrab)! - New hooks useNamespace, useEnsMetadataServiceAvatarUrl, and useENSAppProfileUrl

- [#1054](https://github.com/namehash/ensnode/pull/1054) [`4e7422a`](https://github.com/namehash/ensnode/commit/4e7422aed44239548dacf4eba8f2dd9dd1ecd245) Thanks [@Y3drk](https://github.com/Y3drk)! - Update ENSDb icon and link to ENSDb docs

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Update Identity components to display ENSIP-19 resolution context

- [#1139](https://github.com/namehash/ensnode/pull/1139) [`faad679`](https://github.com/namehash/ensnode/commit/faad6797c5c284bbb110110ed36fd8e870cfa835) Thanks [@Y3drk](https://github.com/Y3drk)! - Introduce "Registrations" module to the ENS Explorer.

- [#1072](https://github.com/namehash/ensnode/pull/1072) [`89da0a3`](https://github.com/namehash/ensnode/commit/89da0a361bc41678abc6bf3eb729600fc9fd4e50) Thanks [@Y3drk](https://github.com/Y3drk)! - Refine Fallback Avatars

- [#1125](https://github.com/namehash/ensnode/pull/1125) [`8519564`](https://github.com/namehash/ensnode/commit/8519564540fe9b7305be0df3679df5d075d1549b) Thanks [@Y3drk](https://github.com/Y3drk)! - Introduce the ENS Explorer to ENSAdmin and support navigating to "Name Detail" pages.

- [#1134](https://github.com/namehash/ensnode/pull/1134) [`184dc1e`](https://github.com/namehash/ensnode/commit/184dc1e74721cd4981b19f6a6579437d5f4351c4) Thanks [@Y3drk](https://github.com/Y3drk)! - Create dedicated "Connection" page.

- [#1158](https://github.com/namehash/ensnode/pull/1158) [`ef7349e`](https://github.com/namehash/ensnode/commit/ef7349e034d4b0fcbf69bfd3c82471ba02e01cc3) Thanks [@notrab](https://github.com/notrab)! - - Apply `ASSUME_IMMUTABLE_QUERY` to name detail page - avatar and profile data now fetches once and caches forever

  - Remove default `refetchInterval` from app-level QueryClient to allow individual queries to control refetch behavior

- [#1009](https://github.com/namehash/ensnode/pull/1009) [`98983ac`](https://github.com/namehash/ensnode/commit/98983ac3c026073da5133aeb64025cbaf88523c8) Thanks [@tk-o](https://github.com/tk-o)! - Drops `latestSyncedBlock` field from `ChainIndexingBackfillStatus` data model.

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Always display ENS names in beautified form.

- [#1012](https://github.com/namehash/ensnode/pull/1012) [`b1c7973`](https://github.com/namehash/ensnode/commit/b1c7973991e3d57b3071e804e429b9189f36d653) Thanks [@Y3drk](https://github.com/Y3drk)! - Enhance ENSNodeConfig UI

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Add support for default chain id in Identity components

- [#1093](https://github.com/namehash/ensnode/pull/1093) [`529e650`](https://github.com/namehash/ensnode/commit/529e6503f4e239aa8b0729644172b20425d63417) Thanks [@tk-o](https://github.com/tk-o)! - Replace `Date` type with `UnixTimestamp` in application logic.

- [#1072](https://github.com/namehash/ensnode/pull/1072) [`89da0a3`](https://github.com/namehash/ensnode/commit/89da0a361bc41678abc6bf3eb729600fc9fd4e50) Thanks [@Y3drk](https://github.com/Y3drk)! - Refine UX for displaying identities without a primary name

- [#1072](https://github.com/namehash/ensnode/pull/1072) [`89da0a3`](https://github.com/namehash/ensnode/commit/89da0a361bc41678abc6bf3eb729600fc9fd4e50) Thanks [@Y3drk](https://github.com/Y3drk)! - Refine UX for Relative Timestamps

- [#1157](https://github.com/namehash/ensnode/pull/1157) [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d) Thanks [@tk-o](https://github.com/tk-o)! - Ensure only the selected version of `@adraffy/ens-normalize` package is used across all apps.

### Patch Changes

- Updated dependencies [[`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9), [`e4d3ce3`](https://github.com/namehash/ensnode/commit/e4d3ce3d9659430a8f0597a4c719ad1993342eaf), [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815), [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d), [`afbf575`](https://github.com/namehash/ensnode/commit/afbf575d8448446f52ab0da8cbe8f5f2d7da6827), [`7fc0465`](https://github.com/namehash/ensnode/commit/7fc0465d3b816affe2930c7f36577d0214d145b9), [`ef7349e`](https://github.com/namehash/ensnode/commit/ef7349e034d4b0fcbf69bfd3c82471ba02e01cc3), [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9), [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815), [`98983ac`](https://github.com/namehash/ensnode/commit/98983ac3c026073da5133aeb64025cbaf88523c8), [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09)]:
  - @ensnode/ensnode-sdk@0.36.0
  - @ensnode/datasources@0.36.0
  - @ensnode/ensnode-react@0.36.0
  - @ensnode/ponder-metadata@0.36.0
  - @ensnode/ensnode-schema@0.36.0

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
