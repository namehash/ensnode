# @ensnode/ensrainbow-sdk

## 1.6.0

### Patch Changes

- [#1688](https://github.com/namehash/ensnode/pull/1688) [`6f4d39b`](https://github.com/namehash/ensnode/commit/6f4d39b026f42ecfeb0f9e21b4473f515dc31a23) Thanks [@djstrong](https://github.com/djstrong)! - `EnsRainbowApiClient.heal()` now accepts labelhashes in any common format — with or without a `0x` prefix, uppercase hex characters, bracket-enclosed encoded labelhashes, or odd-length hex strings — and normalizes them automatically. Invalid inputs return a `HealBadRequestError` rather than throwing.

  The underlying normalization utilities (`parseLabelHash`, `parseEncodedLabelHash`, `parseLabelHashOrEncodedLabelHash`) are also exported from `@ensnode/ensnode-sdk` for use in other contexts.

- [#1425](https://github.com/namehash/ensnode/pull/1425) [`b06e60f`](https://github.com/namehash/ensnode/commit/b06e60ff7d1a8de096c5d99c4ecef5cfdff84750) Thanks [@djstrong](https://github.com/djstrong)! - Adds `/v1/config` endpoint to ENSRainbow API returning public configuration (version, label set, records count) and deprecates `/v1/version` endpoint. The new endpoint provides comprehensive service discovery capabilities for clients.

  Server startup now requires an initialized database (with a precalculated record count). Run ingestion before starting the server so `/v1/config` is accurate and the service is ready to serve. If the database is empty or uninitialized, startup fails with a clear error directing you to run ingestion first.

## 1.5.1

## 1.5.0

## 1.4.0

### Patch Changes

- [#1075](https://github.com/namehash/ensnode/pull/1075) [`706f86b`](https://github.com/namehash/ensnode/commit/706f86b47caf5693153cd2fb7e009b331795d990) Thanks [@djstrong](https://github.com/djstrong)! - Refine ENSRainbow Docs

## 1.3.1

## 1.3.0

## 1.2.0

## 1.1.0

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

## 0.36.0

## 0.35.0

## 0.34.0

## 0.33.0

## 0.32.0

## 0.31.0

## 0.30.0

## 0.29.0

## 0.28.0

### Minor Changes

- [#756](https://github.com/namehash/ensnode/pull/756) [`af2cb03`](https://github.com/namehash/ensnode/commit/af2cb0314bcfc1b5a523670eae558b040407156b) Thanks [@tk-o](https://github.com/tk-o)! - Renamed @ensnode/utils to @ensnode/ensnode-sdk.

## 0.27.0

## 0.26.0

## 0.25.0

## 0.24.0

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
