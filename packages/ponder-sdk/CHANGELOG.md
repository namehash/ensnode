# @ensnode/ponder-sdk

## 1.10.0

### Minor Changes

- [#1864](https://github.com/namehash/ensnode/pull/1864) [`065ecbe`](https://github.com/namehash/ensnode/commit/065ecbecd02f3e438d1cc488001b7cd967f2be59) Thanks [@tk-o](https://github.com/tk-o)! - Added `logger` field to `PonderAppContext` data model.

## 1.9.0

### Minor Changes

- [#1836](https://github.com/namehash/ensnode/pull/1836) [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58) Thanks [@tk-o](https://github.com/tk-o)! - Extended `PonderAppContext` data model with `localPonderAppUrl` field.

- [#1836](https://github.com/namehash/ensnode/pull/1836) [`387715e`](https://github.com/namehash/ensnode/commit/387715e1bc4c996c0ae7545bfc78b79149e04f58) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `localPonderAppUrl` reference with `ponderAppContext.localPonderAppUrl` in the constructor for `LocalPonderClient`.

## 1.8.1

## 1.8.0

### Minor Changes

- [#1807](https://github.com/namehash/ensnode/pull/1807) [`410f937`](https://github.com/namehash/ensnode/commit/410f93798b45ae334a2089135c5fd22b7716b128) Thanks [@tk-o](https://github.com/tk-o)! - Introduced `PonderAppContext` data model to capture the internal context of a local Ponder app.

## 1.7.0

### Minor Changes

- [#1734](https://github.com/namehash/ensnode/pull/1734) [`2d03bcd`](https://github.com/namehash/ensnode/commit/2d03bcd94107168e24b9620721e023cfa17d0440) Thanks [@tk-o](https://github.com/tk-o)! - Fixed logic applied while building indexed blockrange for a chain.

## 1.6.0

### Minor Changes

- [#1602](https://github.com/namehash/ensnode/pull/1602) [`ce9ea49`](https://github.com/namehash/ensnode/commit/ce9ea49ec11e681c03aaa0275fa67b912d6e01f1) Thanks [@tk-o](https://github.com/tk-o)! - Introduce the `ponder-sdk` package, including an initial `PonderClient` implementation.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Includes `mergeBlockNumberRanges` helper function to enable indexed blockrange aggregation, for example, across multiple contract definitions.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `LocalPonderClient` class which wraps `PonderClient` with useful data model enhancements.

- [#1604](https://github.com/namehash/ensnode/pull/1604) [`eec37a7`](https://github.com/namehash/ensnode/commit/eec37a7c21167a4008d3dfaaa87aa6e19a8f728a) Thanks [@tk-o](https://github.com/tk-o)! - Extend `PonderClient` with additional methods: `health()`, `metrics()`.

- [#1699](https://github.com/namehash/ensnode/pull/1699) [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `Blockrange` data model with more versatile ones: `BlockNumberRange` and `BlockRefRange`.

- [#1697](https://github.com/namehash/ensnode/pull/1697) [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87) Thanks [@tk-o](https://github.com/tk-o)! - Introduced streamlined datamodel for block ranges.
