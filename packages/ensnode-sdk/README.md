# ENSNode SDK

This package is a set of libraries enabling smooth interaction with ENSNode services and data, including shared types, data processing (such as validating data and enforcing invariants), and ENS-oriented helper functions.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs/).

## Installation

```bash
npm install @ensnode/ensnode-sdk
```

## ENSNode Client

The `ENSNodeClient` provides a unified interface for the supported ENSNode APIs:
- Resolution API (Protocol Accelerated Forward/Reverse Resolution)
- 🚧 Configuration API
- 🚧 Indexing Status API

### Basic Usage

```typescript
import { ENSNodeClient, evmChainIdToCoinType } from "@ensnode/ensnode-sdk";
import { mainnet } from 'viem/chains';

const client = new ENSNodeClient();

// Resolution API: Records Resolution
const { records } = await client.resolveRecords("vitalik.eth", {
  addresses: [evmChainIdToCoinType(mainnet.id)],
  texts: ["avatar", "com.twitter"],
});

// Resolution API: Primary Name Resolution
const { records } = await client.resolvePrimaryName("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", mainnet.id);
```

### API Methods

#### Resolution API

##### `resolveRecords(name, selection)`

Resolves records for an ENS name (Forward Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

- `name`: The ENS Name whose records to resolve
- `selection`: Optional selection of Resolver records:
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve

```ts
import { mainnet, base } from 'viem/chains';

const { records } = await client.resolveRecords("vitalik.eth", {
  // Resolve vitalik.eth's ETH Mainnet Address (if set) and Base Address (if set)
  addresses: [evmChainIdToCoinType(mainnet.id), evmChainIdToCoinType(base.id)],
  // or pass the CoinTypes directly if you know them
  // addresses: [60, 2147492101],
  texts: ["avatar", "com.twitter"],
});
```

##### `resolvePrimaryName(address, chainId)`

Resolves the primary name of a provided address on the specified chainId (Reverse Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

- `address`: The Address whose Primary Name to resolve
- `chainId`: The chain id within which to query the address' ENSIP-19 Multichain Primary Name

```ts
import { mainnet } from 'viem/chains';

// Resolve the Primary Name of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 on ETH Mainnet
const { name } = await client.resolvePrimaryName("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", mainnet.id);
```

### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://my-ensnode-instance.com"),
});
```
