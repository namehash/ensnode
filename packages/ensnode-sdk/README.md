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
- Indexing Status API
- Configuration API

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
const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", mainnet.id);
// name === 'gregskril.eth'

// Resolution API: Primary Names Resolution
const { names } = await client.resolvePrimaryNames("0x179A862703a4adfb29896552DF9e307980D19285");
// names === { '1': 'gregskril.eth', "8453": "greg.base.eth", ... }
```

### API Methods

#### Resolution API

##### `resolveRecords(name, selection, options)`

Resolves records for an ENS name (Forward Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

The returned `name` field, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name). If the name record returned by the resolver is not normalized, `null` is returned as if no name record was set.

- `name`: The ENS Name whose records to resolve
- `selection`: Optional selection of Resolver records:
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve
- `options`: (optional) additional options
  - `trace`: (optional) Whether to include a trace in the response (default: false)
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)


```ts
import { mainnet, base } from 'viem/chains';

const { records } = await client.resolveRecords("greg.base.eth", {
  // Resolve ETH Mainnet Address (if set) and Base Address (if set)
  addresses: [evmChainIdToCoinType(mainnet.id), evmChainIdToCoinType(base.id)],
  // or pass the CoinTypes directly if you know them
  // addresses: [60, 2147492101],
  texts: ["avatar", "com.twitter"],
});

console.log(records);
// {
//   "addresses": {
//     "60": "0x179A862703a4adfb29896552DF9e307980D19285",
//     "2147492101": "0x179A862703a4adfb29896552DF9e307980D19285"
//   },
//   "texts": {
//     "avatar": "https://...",
//     "com.twitter": "gregskril"
//   }
// }
```

##### `resolvePrimaryName(address, chainId, options)`

Resolves the primary name of the provided `address` on the specified `chainId`, via ENSNode, which implements Protocol Acceleration for indexed names. If the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default Name will be returned. You _may_ query the Default EVM Chain Id (`0`) in order to determine the `address`'s Default Name directly.

The returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name). If the primary name set for the address is not normalized, `null` is returned as if no primary name was set.

- `address`: The Address whose Primary Name to resolve
- `chainId`: The chain id within which to query the address' ENSIP-19 Multichain Primary Name
- `options`: (optional) additional options
  - `trace`: (optional) Whether to include a trace in the response (default: false)
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)

```ts
import { mainnet, base } from 'viem/chains';
import { DEFAULT_EVM_CHAIN_ID } from '@ensnode/ensnode-sdk';

// Resolve the address' Primary Name on Ethereum Mainnet
const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", mainnet.id);
// name === 'gregskril.eth'

// Resolve the address' Primary Name on Base
const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", base.id);
// name === 'greg.base.eth'

// Resolve the address' Default Primary Name
const { name } = await client.resolvePrimaryName("0x179A862703a4adfb29896552DF9e307980D19285", DEFAULT_EVM_CHAIN_ID);
// name === 'gregskril.eth'
```

##### `resolvePrimaryNames(address, options)`

Resolves the primary names of the provided `address` on the specified chainIds, via ENSNode, which implements Protocol Acceleration for indexed names. If the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default Name will be returned for all chainIds for which there is not a chain-specific Primary Name. You may _not_ query the Default EVM Chain Id (`0`) directly (see `resolvePrimaryName` if you need to explicitly determine the `address`'s Default Primary Name).

Each returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name). If the primary name set for the address on any chain is not normalized, `null` is returned for that chain as if no primary name was set.

- `address`: The Address whose Primary Names to resolve
- `options`: (optional) additional options
  - `chainIds`: The chain ids within which to query the address' ENSIP-19 Multichain Primary Name (default: all ENSIP-19 supported chains)
  - `trace`: (optional) Whether to include a trace in the response (default: false)
  - `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)

```ts
import { mainnet, base } from 'viem/chains';

// Resolve an address' Primary Names on all ENSIP-19 supported chain ids
const { names } = await client.resolvePrimaryNames("0x179A862703a4adfb29896552DF9e307980D19285");

console.log(names);
// {
//   "1": "gregskril.eth", // Default Primary Name
//   "10": "gregskril.eth", // Default Primary Name
//   "8453": "greg.base.eth", // Base-specific Primary Name!
//   "42161": "gregskril.eth", // Default Primary Name
//   "59144": "gregskril.eth", // Default Primary Name
//   "534352": "gregskril.eth" // Default Primary Name
// }

// Resolve an address' Primary Names on specific chain Ids
const { names } = await client.resolvePrimaryNames("0x179A862703a4adfb29896552DF9e307980D19285", {
  chainIds: [mainnet.id, base.id],
});

console.log(names);
// {
//   "1": "gregskril.eth",
//   "8453": "greg.base.eth", // base-specific Primary Name!
// }
```

#### Configuration API

##### `config()`

Fetches the ENSNode's configuration.

- Returns: `ConfigResponse` - The ENSNode configuration data
- Throws: Error if the request fails or the ENSNode API returns an error response

```ts
const config = await client.config();
console.log(config);
// Returns the ENSNode configuration including indexed chains, etc.
```

#### Indexing Status API

##### `indexingStatus(options)`

Fetches the ENSNode's multichain indexing status.

- `options`: (optional) additional options
  - `maxRealtimeDistance`: (optional) The max allowed distance in seconds between the latest indexed block of the slowest indexed chain and the current time. Setting this parameter influences the HTTP response code:
    - Success (200 OK): The latest indexed block of each chain is within the requested distance from realtime
    - Service Unavailable (503): The latest indexed block of each chain is NOT within the requested distance from realtime
- Returns: `IndexingStatusResponse` - The indexing status data for all indexed chains
- Throws: Error if the request fails or the ENSNode API returns an error response

```ts
// Get current indexing status
const status = await client.indexingStatus();
console.log(status);
// Returns indexing status for all indexed chains

// Check if omnichain indexing is within 60 seconds of realtime
const status = await client.indexingStatus({ maxRealtimeDistance: 60 });
console.log(status);
// Returns indexing status, throws if not within 60 seconds of realtime
```

### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://my-ensnode-instance.com"),
});
```
