# @ensnode/ensnode-react

## 0.36.0

### Minor Changes

- [#1158](https://github.com/namehash/ensnode/pull/1158) [`ef7349e`](https://github.com/namehash/ensnode/commit/ef7349e034d4b0fcbf69bfd3c82471ba02e01cc3) Thanks [@notrab](https://github.com/notrab)! - - Add `ASSUME_IMMUTABLE_QUERY` constant for queries that should only fetch once per unique key (similar to SWR's `immutable: true`)

  - Apply `ASSUME_IMMUTABLE_QUERY` to `useENSIndexerConfig` so the client fetches the config endpoint once and caches forever
  - Add 10s `refetchInterval` to `useIndexingStatus` for automatic polling of indexing progress
  - Add 10s default `refetchInterval` to `ENSNodeProvider` QueryClient
  - Export `ASSUME_IMMUTABLE_QUERY` from package index for use in applications

- [#1137](https://github.com/namehash/ensnode/pull/1137) [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815) Thanks [@lightwalker-eth](https://github.com/lightwalker-eth)! - introduce useResolvedIdentity hook

- [#1095](https://github.com/namehash/ensnode/pull/1095) [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09) Thanks [@tk-o](https://github.com/tk-o)! - Refine Indexing Status API data model around _snapshots_ and _projections_.

### Patch Changes

- Updated dependencies [[`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9), [`e4d3ce3`](https://github.com/namehash/ensnode/commit/e4d3ce3d9659430a8f0597a4c719ad1993342eaf), [`1460d20`](https://github.com/namehash/ensnode/commit/1460d204a4b4ff798597577f63c3a2a801bfc815), [`ffb4103`](https://github.com/namehash/ensnode/commit/ffb4103aeb2ce3cb4c5a37885de62fa4f435362d), [`6b5bfd0`](https://github.com/namehash/ensnode/commit/6b5bfd00a8d8217a76da0bec9d8ee6685adc29e9), [`98983ac`](https://github.com/namehash/ensnode/commit/98983ac3c026073da5133aeb64025cbaf88523c8), [`16b4748`](https://github.com/namehash/ensnode/commit/16b474849386387141fe2534574f8b16defbcb09)]:
  - @ensnode/ensnode-sdk@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@0.35.0

## 0.34.0

### Patch Changes

- Updated dependencies [[`845a037`](https://github.com/namehash/ensnode/commit/845a03761dc830303a56cd70fe0d57c36d78a663), [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa), [`6f20c5d`](https://github.com/namehash/ensnode/commit/6f20c5dd1bdc8517679155efff6e6c461b15defa)]:
  - @ensnode/ensnode-sdk@0.34.0
