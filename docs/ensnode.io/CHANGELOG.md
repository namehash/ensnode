# @docs/ensnode

## 1.6.0

### Minor Changes

- [#1699](https://github.com/namehash/ensnode/pull/1699) [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2) Thanks [@tk-o](https://github.com/tk-o)! - Updated `docs/usage/api/` page.

### Patch Changes

- [#1558](https://github.com/namehash/ensnode/pull/1558) [`69f5c6b`](https://github.com/namehash/ensnode/commit/69f5c6bd27215a855d2dd4eaeb258bcf7cc6ea82) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Activate Context7 to assist builders using LLMs to build on ENSNode

- [#1579](https://github.com/namehash/ensnode/pull/1579) [`a14120d`](https://github.com/namehash/ensnode/commit/a14120df5b6ff85f922ddc57b2e241706a445337) Thanks [@tk-o](https://github.com/tk-o)! - Included ENSRainbow Searchlight instance on _Hosted ENSRainbow Instances_ page.

## 1.5.1

### Patch Changes

- [#1534](https://github.com/namehash/ensnode/pull/1534) [`bc1897d`](https://github.com/namehash/ensnode/commit/bc1897d99fe6f3e3b33db77e76eb1943cbcdbb71) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - Refine docs for the ENS Subgraph

## 1.5.0

## 1.4.0

### Minor Changes

- [#1412](https://github.com/namehash/ensnode/pull/1412) [`fae127e`](https://github.com/namehash/ensnode/commit/fae127ed94a62a212d406daed9e86a0c51eb4f37) Thanks [@tk-o](https://github.com/tk-o)! - Extends `Realtime Indexing Distance` section on the API Usage page.

### Patch Changes

- [#1075](https://github.com/namehash/ensnode/pull/1075) [`706f86b`](https://github.com/namehash/ensnode/commit/706f86b47caf5693153cd2fb7e009b331795d990) Thanks [@djstrong](https://github.com/djstrong)! - Refine ENSRainbow Docs

## 1.3.1

## 1.3.0

## 1.2.0

### Patch Changes

- [#1346](https://github.com/namehash/ensnode/pull/1346) [`9b498d9`](https://github.com/namehash/ensnode/commit/9b498d9ceb0d712213b56f0ce157d4728032fe79) Thanks [@djstrong](https://github.com/djstrong)! - Capitalize "Namehash Labs" to "NameHash Labs"

## 1.1.0

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Minor Changes

- [#1265](https://github.com/namehash/ensnode/pull/1265) [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2) Thanks [@tk-o](https://github.com/tk-o)! - Document the HTTP endpoint for Registrar Actions API.

- [#1257](https://github.com/namehash/ensnode/pull/1257) [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5) Thanks [@tk-o](https://github.com/tk-o)! - Update API docs.

- [#1260](https://github.com/namehash/ensnode/pull/1260) [`0fca0c9`](https://github.com/namehash/ensnode/commit/0fca0c987441667d57c27e7a95c2a5c6076af6df) Thanks [@notrab](https://github.com/notrab)! - Use the new ENSApi icon for documentation sidebar

## 0.36.0

### Minor Changes

- [#1015](https://github.com/namehash/ensnode/pull/1015) [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9) Thanks [@tk-o](https://github.com/tk-o)! - Rename chain indexing status from `Unstarted` to `Queued`.

- [#1157](https://github.com/namehash/ensnode/pull/1157) [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d) Thanks [@tk-o](https://github.com/tk-o)! - Update `Terminology` page to include information about ENS Normalize version.

- [#1095](https://github.com/namehash/ensnode/pull/1095) [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09) Thanks [@tk-o](https://github.com/tk-o)! - Implement refined Indexing Status API data model.

- [#1098](https://github.com/namehash/ensnode/pull/1098) [`d2e6647`](https://github.com/namehash/ensnode/commit/d2e66472cfb7962c3bfe355c9c1587e3e50f2c9d) Thanks [@notrab](https://github.com/notrab)! - use new connection url param name for ensnode direct links

- [#1054](https://github.com/namehash/ensnode/pull/1054) [`4e7422a`](https://github.com/namehash/ensnode/commit/4e7422aed44239548dacf4eba8f2dd9dd1ecd245) Thanks [@Y3drk](https://github.com/Y3drk)! - Add a placeholder docs section for ENSDb

## 0.35.0

## 0.34.0

### Minor Changes

- [#612](https://github.com/namehash/ensnode/pull/612) [`20322cd`](https://github.com/namehash/ensnode/commit/20322cdd0cccd2b14eb8789acd1f0bd42da5bc3b) Thanks [@djstrong](https://github.com/djstrong)! - Updated documentation for the new ENSRainbow v2 architecture. This includes details on the new `.ensrainbow` data format, the data-less Docker image distribution, and the process of downloading pre-ingested databases on startup.

- [#612](https://github.com/namehash/ensnode/pull/612) [`20322cd`](https://github.com/namehash/ensnode/commit/20322cdd0cccd2b14eb8789acd1f0bd42da5bc3b) Thanks [@djstrong](https://github.com/djstrong)! - Introduced ENSRainbow v2 data format.

  This change addresses large Docker image sizes and data management challenges.

  Key changes:

  - A new .ensrainbow data format replaces SQL dumps, supporting label set IDs and versioned label sets for incremental data updates.
  - ENSRainbow is now distributed as a lightweight, data-less Docker image.
  - On first startup, the application downloads a pre-ingested database from R2, significantly reducing setup time.
  - This new architecture allows for deterministic data healing and easier data evolution.

## 0.0.2

### Patch Changes

- [#890](https://github.com/namehash/ensnode/pull/890) [`95c9140`](https://github.com/namehash/ensnode/commit/95c91404bd699705602d5ec19e76242b05057a44) Thanks [@djstrong](https://github.com/djstrong)! - Enhance RPC configuration guidance.

- [#912](https://github.com/namehash/ensnode/pull/912) [`886f8ca`](https://github.com/namehash/ensnode/commit/886f8ca27dfab5302fae4e04a89d1b3fce21cf04) Thanks [@djstrong](https://github.com/djstrong)! - remove deprecated `/ponder` endpoint and update documentation
