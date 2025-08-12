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
const { records } = await client.resolveRecords("jesse.base.eth", {
  addresses: [evmChainIdToCoinType(mainnet.id)],
  texts: ["avatar", "com.twitter"],
});

// Resolution API: Primary Name Resolution
const { name } = await client.resolvePrimaryName("0x2211d1D0020DAEA8039E46Cf1367962070d77DA9", mainnet.id);
// name === 'jesse.base.eth'

// Resolution API: Primary Names Resolution
const { names } = await client.resolvePrimaryNames("0x2211d1D0020DAEA8039E46Cf1367962070d77DA9");
// names === { 1: 'jesse.base.eth' }
```

### API Methods

#### Resolution API

##### `resolveRecords(name, selection, options)`

Resolves records for an ENS name (Forward Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

- `name`: The ENS Name whose records to resolve
- `selection`: Optional selection of Resolver records:
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve
- `options`: (optional) additional options
  - `trace`: (optional) Whether to include a trace in the response
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: true)


```ts
import { mainnet, base } from 'viem/chains';

const { records } = await client.resolveRecords("jesse.base.eth", {
  // Resolve jesse.base.eth's ETH Mainnet Address (if set) and Base Address (if set)
  addresses: [evmChainIdToCoinType(mainnet.id), evmChainIdToCoinType(base.id)],
  // or pass the CoinTypes directly if you know them
  // addresses: [60, 2147492101],
  texts: ["avatar", "com.twitter"],
});
```

##### `resolvePrimaryName(address, chainId, options)`

Resolves the primary name of a provided address on the specified chainId (Reverse Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

- `address`: The Address whose Primary Name to resolve
- `chainId`: The chain id within which to query the address' ENSIP-19 Multichain Primary Name
- `options`: (optional) additional options
  - `trace`: (optional) Whether to include a trace in the response
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: true)


```ts
import { mainnet } from 'viem/chains';

// Resolve the Primary Name of 0x2211d1D0020DAEA8039E46Cf1367962070d77DA9 on ETH Mainnet
const { name } = await client.resolvePrimaryName("0x2211d1D0020DAEA8039E46Cf1367962070d77DA9", mainnet.id);
```

##### `resolvePrimaryNames(address, options)`

Resolves the primary name of a provided address on the specified chainId (Reverse Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

- `address`: The Address whose Primary Name to resolve
- `options`: (optional) additional options
  - `chainIds`: The chain ids within which to query the address' ENSIP-19 Multichain Primary Name (defaults to all ENSIP-19 supported chains)
  - `trace`: (optional) Whether to include a trace in the response
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: true)

```ts
import { mainnet } from 'viem/chains';

// Resolve the Primary Names of 0x2211d1D0020DAEA8039E46Cf1367962070d77DA9 on all ENSIP-19 supported chains
const { names } = await client.resolvePrimaryName("0x2211d1D0020DAEA8039E46Cf1367962070d77DA9");
```


### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://my-ensnode-instance.com"),
});
```
