# @docs/ensnode

## 1.0.0

### Minor Changes

- [#612](https://github.com/namehash/ensnode/pull/612) [`20322cd`](https://github.com/namehash/ensnode/commit/20322cdd0cccd2b14eb8789acd1f0bd42da5bc3b) Thanks [@djstrong](https://github.com/djstrong)! - Updated documentation for the new ENSRainbow v2 architecture. This includes details on the new `.ensrainbow` data format, the data-less Docker image distribution, and the process of downloading pre-ingested databases on startup.

- [#612](https://github.com/namehash/ensnode/pull/612) [`20322cd`](https://github.com/namehash/ensnode/commit/20322cdd0cccd2b14eb8789acd1f0bd42da5bc3b) Thanks [@djstrong](https://github.com/djstrong)! - Introduced ENSRainbow v2 data format.

  This change addresses large Docker image sizes and data management challenges.

  Key changes:

  - A new .ensrainbow data format replaces SQL dumps, supporting label set IDs and versioned label sets for incremental data updates.
  - ENSRainbow is now distributed as a lightweight, data-less Docker image.
  - On first startup, the application downloads a pre-ingested database from R2, significantly reducing setup time.
  - This new architecture allows for deterministic data healing and easier data evolution.
