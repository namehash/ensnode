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

// Resolution API (Forward Resolution)
const { records } = await client.resolveForward("vitalik.eth", {
  addresses: [60],
  texts: ["avatar", "com.twitter"],
});

// Resolution API (Reverse Resolution)
const { records } = await client.resolveReverse("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
```

### API Methods

#### Resolution API

##### `resolveForward(name, selection?)`

Resolves the selected records for the provided Name.

- `name`: The ENS name to resolve
- `selection`: Optional object specifying what records to resolve:
  - `name`: Include canonical name
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve

##### `resolveAddress(address, chainId?)`

Resolves the Primary Name on the specified `chainId` for the provided Address.

- `address`: The address to resolve
- `chainId`: Optional chain ID (defaults to 1 for Ethereum mainnet)

### Configuration

```typescript
const client = new ENSNodeClient({
  url: new URL("https://custom-api.ensnode.io"),
});
```
