# @ensnode/ponder-sdk

## 1.6.0

### Minor Changes

- [#1602](https://github.com/namehash/ensnode/pull/1602) [`ce9ea49`](https://github.com/namehash/ensnode/commit/ce9ea49ec11e681c03aaa0275fa67b912d6e01f1) Thanks [@tk-o](https://github.com/tk-o)! - Introduce the `ponder-sdk` package, including an initial `PonderClient` implementation.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Includes `mergeBlockNumberRanges` helper function to enable indexed blockrange aggregation, for example, across multiple contract definitions.

- [#1675](https://github.com/namehash/ensnode/pull/1675) [`a13e206`](https://github.com/namehash/ensnode/commit/a13e206d4e5c5bfa91c2687bdd602542cc8e887c) Thanks [@tk-o](https://github.com/tk-o)! - Introduces `LocalPonderClient` class which wraps `PonderClient` with useful data model enhancements.

- [#1604](https://github.com/namehash/ensnode/pull/1604) [`eec37a7`](https://github.com/namehash/ensnode/commit/eec37a7c21167a4008d3dfaaa87aa6e19a8f728a) Thanks [@tk-o](https://github.com/tk-o)! - Extend `PonderClient` with additional methods: `health()`, `metrics()`.

- [#1699](https://github.com/namehash/ensnode/pull/1699) [`3d7fb07`](https://github.com/namehash/ensnode/commit/3d7fb074a7e25e0cb025fe285f71282a91efddc2) Thanks [@tk-o](https://github.com/tk-o)! - Replaced `Blockrange` data model with more versatile ones: `BlockNumberRange` and `BlockRefRange`.

- [#1697](https://github.com/namehash/ensnode/pull/1697) [`70b15a1`](https://github.com/namehash/ensnode/commit/70b15a18800921d3a28e1dcfe512a79287537d87) Thanks [@tk-o](https://github.com/tk-o)! - Introduced streamlined datamodel for block ranges.
