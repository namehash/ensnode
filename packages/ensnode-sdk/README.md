# ENSNode SDK

This package is a set of libraries enabling smooth interaction with ENSNode services and data, including shared types, data processing (such as validating data and enforcing invariants), and ENS-oriented helper functions.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs/).

## Installation

```bash
npm install @ensnode/ensnode-sdk
```

## ENSNode Client

The `ENSNodeClient` provides a unified interface for the supported ENSNode APIs:
- Resolution API
- 🚧 Configuration API
- 🚧 Indexing Status API

### Basic Usage

```typescript
import { ENSNodeClient } from "@ensnode/ensnode-sdk";

const client = new ENSNodeClient();

// Resolution API (Records Resolution)
const { records } = await client.resolveRecords("vitalik.eth", {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
});

// Resolution API (Primary Name Resolution)
const { records } = await client.resolvePrimaryName("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
```

### API Methods

#### Resolution API

##### `resolveRecords(name, selection?)`

Resolves records for an ENS name (Forward Resolution).

- `name`: The ENS Name whose records to resolve
- `selection`: Optional selection of Resolver records:
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve

##### `resolvePrimaryName(address, chainId?)`

Resolves the primary name of a specified address (Reverse Resolution).

- `address`: The Address whose Primary Name to resolve
- `chainId`: Optional chain id within which to query the address' ENSIP-19 Multichain Primary Name (defaulting to Ethereum Mainnet [1])

### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://custom-api.ensnode.io"),
});
```
