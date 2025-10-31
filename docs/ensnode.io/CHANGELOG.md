# @docs/ensnode

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
