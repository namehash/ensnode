# @ensnode/ensnode-react

## 1.0.2

### Patch Changes

- Updated dependencies [[`f6aeb17`](https://github.com/namehash/ensnode/commit/f6aeb17330da0f73ee337a2f94a02cabbab6613e)]:
  - @ensnode/ensnode-sdk@1.0.2

## 1.0.1

### Patch Changes

- [#1308](https://github.com/namehash/ensnode/pull/1308) [`1609f2a`](https://github.com/namehash/ensnode/commit/1609f2a47a3e40ccf4b80c182dc626fb2331c745) Thanks [@tk-o](https://github.com/tk-o)! - Technical change to allow publishing `1.0.1` package to NPM registry.

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.0.1

## 1.0.0

### Minor Changes

- [#1207](https://github.com/namehash/ensnode/pull/1207) [`61b9472`](https://github.com/namehash/ensnode/commit/61b94721aee0d7050ebc3e384d5c8e2cd65cc08d) Thanks [@notrab](https://github.com/notrab)! - Allow the latest version of React to be used with ENSNode React

- [#1282](https://github.com/namehash/ensnode/pull/1282) [`4611fed`](https://github.com/namehash/ensnode/commit/4611fedfff6c7fb67c286887a1e909b0f0d7ec12) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `useSwrQuery` hook as an SWR proxy for `useQuery` hook.

- [#1272](https://github.com/namehash/ensnode/pull/1272) [`25a40ba`](https://github.com/namehash/ensnode/commit/25a40ba8517681ac09e3c823f63c197e8758fe41) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `useRegistrarActions` hook.

- [#1211](https://github.com/namehash/ensnode/pull/1211) [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5) Thanks [@shrugs](https://github.com/shrugs)! - BREAKING: `useENSNodeConfig` has been renamed to `useENSNodeSDKConfig`. `useENSIndexerConfig` has been renamed to `useENSNodeConfig`.

### Patch Changes

- Updated dependencies [[`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`bbf0d3b`](https://github.com/namehash/ensnode/commit/bbf0d3b6e328f5c18017bd7660b1ff93e7214ce2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`d7b2e23`](https://github.com/namehash/ensnode/commit/d7b2e23e856ffb1d7ce004f9d4277842fa6cf1d5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`11b8372`](https://github.com/namehash/ensnode/commit/11b8372ccb2456f2e71d9195f6e50b2fbbeb405a), [`617ab00`](https://github.com/namehash/ensnode/commit/617ab00cc57c2dc9df5af90eeaf3896f8864145d), [`63376ad`](https://github.com/namehash/ensnode/commit/63376ad8a4f1fe72b7ad5a9368496d235411bc28), [`df1cf8c`](https://github.com/namehash/ensnode/commit/df1cf8c4a0d4fe0db4750b46f721416c72ba86d2), [`554e598`](https://github.com/namehash/ensnode/commit/554e59868105c5f26ca2bdf8924c6b48a95696e5), [`965707d`](https://github.com/namehash/ensnode/commit/965707d409d1e8917adebd869ec5deee695e7893), [`6659c57`](https://github.com/namehash/ensnode/commit/6659c57e487938761d642a5f46ff0e86baeac286), [`40658a7`](https://github.com/namehash/ensnode/commit/40658a70d591d972150f69cb18fbd3dd390b4114)]:
  - @ensnode/ensnode-sdk@1.0.0

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
