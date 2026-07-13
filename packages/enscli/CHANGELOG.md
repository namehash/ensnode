# enscli

## 1.17.0

### Patch Changes

- Updated dependencies [[`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`6542c89`](https://github.com/namehash/ensnode/commit/6542c89569add9fd315bb1f10a9263f59d52da20), [`edf120e`](https://github.com/namehash/ensnode/commit/edf120e13980ceccf075dede9f8dbfd10c5353af), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`af444c3`](https://github.com/namehash/ensnode/commit/af444c32a9afa5ed741e8b6dbbeafdfadf90f2ba), [`566cab2`](https://github.com/namehash/ensnode/commit/566cab2e064496c3f248c1f22056a7c7e89f5b14), [`6abf99b`](https://github.com/namehash/ensnode/commit/6abf99b9bca9a54cef209e2ef32433397efa31dc), [`eaab1bf`](https://github.com/namehash/ensnode/commit/eaab1bffdc0db0f61ccdd06efe0f63aaddf709e3)]:
  - @ensnode/datasources@1.17.0
  - enssdk@1.17.0
  - @ensnode/ensnode-sdk@1.17.0
  - @ensnode/ensrainbow-sdk@1.17.0

## 1.16.0

### Patch Changes

- Updated dependencies []:
  - @ensnode/ensnode-sdk@1.16.0
  - enssdk@1.16.0
  - @ensnode/datasources@1.16.0
  - @ensnode/ensrainbow-sdk@1.16.0

## 1.15.2

### Patch Changes

- [#2242](https://github.com/namehash/ensnode/pull/2242) [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54) Thanks [@shrugs](https://github.com/shrugs)! - `enscli` gains `datasources identify <address>`: an offline command that reports which well-known ENS contract an address corresponds to. It accepts a bare address, a chain-scoped `chainId:address`, or full CAIP-10 `eip155:chainId:address`, and `--namespace` (default `mainnet`) selects which namespace to search. A miss returns `{ matches: [] }` with exit code `0`.

- [#2242](https://github.com/namehash/ensnode/pull/2242) [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54) Thanks [@shrugs](https://github.com/shrugs)! - Introduce `enscli`, a new agent- and human-friendly CLI for ENS that wraps `enssdk` and the ENS Omnigraph. It supports raw Omnigraph queries (`enscli ensnode omnigraph "<query>" --variables …`), offline schema exploration (`enscli ensnode omnigraph schema [Type[.field]]`), indexing status, ENSRainbow healing, and `namehash`/`labelhash`. It defaults to NameHash-hosted instances per `--namespace` (mainnet, sepolia, sepolia-v2), resolves config from flags/env/`.env`, outputs JSON when piped and a pretty form in a TTY, and hardens inputs against agent hallucinations.

- Updated dependencies [[`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`0eec193`](https://github.com/namehash/ensnode/commit/0eec19344e576db7021ab4f16c420477efe9cd54), [`83ed372`](https://github.com/namehash/ensnode/commit/83ed37246871caf30afca56a80c4613311f60523), [`39cb445`](https://github.com/namehash/ensnode/commit/39cb445b8d8790aa9d6fe2ee904e60bdb158efbd), [`04388d2`](https://github.com/namehash/ensnode/commit/04388d2193f422a95898eb0ee23e7555397b3ab6), [`6165f50`](https://github.com/namehash/ensnode/commit/6165f50e26729c6d740c7424034057642f5175b5)]:
  - @ensnode/datasources@1.15.2
  - @ensnode/ensnode-sdk@1.15.2
  - enssdk@1.15.2
  - @ensnode/ensrainbow-sdk@1.15.2

## 1.15.1

## 1.15.0

## 1.14.0

## 1.13.1

## 1.13.0

## 1.12.0

## 1.11.1

## 1.11.0

## 1.10.1

## 1.10.0
