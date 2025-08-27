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

The returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).

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

Resolves the primary names of the provided `address` on the specified chainIds, via ENSNode, which implements Protocol Acceleration for indexed names. If the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default Name will be returned for all chainIds for which there is not a chain-specific Primary Name. To avoid misuse, you _may not_ query the Default EVM Chain Id (`0`) directly, and should rely on the aforementioned per-chain defaulting behavior.

Each returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name).

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
//   "1": "gregskril.eth",
//   "10": "gregskril.eth",
//   "8453": "greg.base.eth", // base-specific Primary Name!
//   "42161": "gregskril.eth",
//   "59144": "gregskril.eth",
//   "534352": "gregskril.eth"
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


### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://my-ensnode-instance.com"),
});
```
