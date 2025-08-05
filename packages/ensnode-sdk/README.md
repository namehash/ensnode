# ENSNode SDK

This package is a set of libraries enabling smooth interaction with ENSNode services and data, including data processing (such as validating data and enforcing invariants), and ENS-oriented helper functions.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs/).

## Package overview

- [`utils`](utils) A utility library for interacting with ENS (Ethereum Name Service) data. It contains various helper functions and tools to facilitate interactions with ENS and ENSNode instances.
- [`client`](src/client.ts) A unified TypeScript client for all ENSNode APIs, providing methods for resolution, configuration, and indexing status.

## Installation

```bash
npm install @ensnode/ensnode-sdk
```

## ENSNode Client

The `ENSNodeClient` provides a unified interface for all ENSNode API operations:

### Basic Usage

```typescript
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient();

// Resolution operations
const nameResult = await client.resolveName("vitalik.eth", {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
});

const addressResult = await client.resolveAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
```

### API Methods

#### Resolution

##### `resolveName(name, selection?)`

Resolves an ENS name to records (forward resolution).

- `name`: The ENS name to resolve
- `selection`: Optional object specifying what records to resolve:
  - `name`: Include canonical name
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve

##### `resolveAddress(address, chainId?)`

Resolves an address to its primary name (reverse resolution).

- `address`: The address to resolve
- `chainId`: Optional chain ID (defaults to 1 for Ethereum mainnet)

### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://custom-api.ensnode.io"),
});
```

### Complete Example

```typescript
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({
  url: new URL("https://api.mainnet.ensnode.io"),
});

// Resolve name
const resolution = await client.resolveName("vitalik.eth", {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
});
console.log("Records:", resolution.records);

// Reverse resolution
const reverse = await client.resolveAddress(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
console.log("Primary name:", reverse.records.name);
```
