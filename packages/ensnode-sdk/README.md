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

// Configuration operations
const config = await client.getConfig();
console.log("Indexer version:", config.version);
console.log("Supported chains:", config.chains);

// Indexing status operations
const status = await client.getStatus();
console.log("Indexing status:", status.status);
console.log("Progress:", status.progress);
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

#### Configuration

##### `getConfig()`

Returns indexer configuration including version, supported chains, and feature flags.

```typescript
const config = await client.getConfig();
console.log("Version:", config.version);
console.log(
  "Enabled chains:",
  config.chains.filter((c) => c.enabled)
);
console.log("Features:", config.features);
```

#### Indexing Status

##### `getStatus()`

Returns current indexing status and progress.

```typescript
const status = await client.getStatus();
console.log("Status:", status.status); // "syncing" | "synced" | "error"
console.log("Progress:", status.progress); // 0-100
console.log("Current block:", status.currentBlock);
console.log("Latest block:", status.latestBlock);

// Per-chain status
status.chains.forEach((chain) => {
  console.log(`Chain ${chain.id}: ${chain.status}`);
});
```

### Configuration

```typescript
const client = new ENSNodeClient({
  endpointUrl: new URL("https://custom-api.ensnode.io"),
  debug: true,
});
```

### Complete Example

```typescript
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient({
  endpointUrl: new URL("https://api.mainnet.ensnode.io"),
  debug: false,
});

// Check indexer status
const status = await client.getStatus();
if (status.status === "synced") {
  console.log("✅ Indexer is fully synced");
} else {
  console.log(`⚠️ Indexer syncing: ${status.progress.toFixed(2)}%`);
}

// Get configuration
const config = await client.getConfig();
console.log(`Version: ${config.version}`);

// Resolve name
const resolution = await client.resolveName("vitalik.eth", {
  name: true,
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
