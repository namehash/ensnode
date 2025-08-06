# @ensnode/ensnode-react

React hooks and providers for the ENSNode API. This package provides a React-friendly interface to the ENSNode SDK with automatic caching, loading states, and error handling. **TanStack Query is handled automatically** - no setup required unless you want custom configuration.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs/).

## Installation

```bash
npm install @ensnode/ensnode-react @ensnode/ensnode-sdk
```

Note: `@tanstack/react-query` is a peer dependency but you don't need to interact with it directly unless you want advanced query customization.

## Quick Start

### 1. Setup the Provider

Wrap your app with the `ENSNodeProvider`:

```tsx
import { ENSNodeProvider, createConfig } from "@ensnode/ensnode-react";

const config = createConfig({ url: "https://api.alpha.ensnode.io" });

function App() {
  return (
    <ENSNodeProvider config={config}>
      <YourApp />
    </ENSNodeProvider>
  );
}
```

That's it! No need to wrap with `QueryClientProvider` or create a `QueryClient` - it's all handled automatically. Each ENSNode endpoint gets its own isolated cache for proper data separation.

### 2. Use the Hooks

#### Records Resolution — `useRecords`

```tsx
import { useRecords } from "@ensnode/ensnode-react";

function DisplayNameRecords() {
  const { data, isLoading, error } = useRecords({
    name: "vitalik.eth",
    selection: {
      addresses: [60], // ETH
      texts: ["avatar", "com.twitter"],
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Resolved Records for vitalik.eth</h3>
      {data.records.addresses && (
        <p>ETH Address: {data.records.addresses["60"]}</p>
      )}
      {data.records.texts && (
        <div>
          <p>Avatar: {data.records.texts.avatar}</p>
          <p>Twitter: {data.records.texts["com.twitter"]}</p>
        </div>
      )}
    </div>
  );
}
```

#### Primary Name Resolution — `usePrimaryName`

```tsx
import { mainnet } from 'viem/chains';
import { usePrimaryName } from "@ensnode/ensnode-react";

function DisplayPrimaryNameAndAvatar() {
  const { data, isLoading, error } = usePrimaryName({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chainId: mainnet.id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Primary Name (for Mainnet)</h3>
      <p>{data.name ?? 'No Primary Name'}</p>
    </div>
  );
}
```

## API Reference

### ENSNodeProvider

The provider component that supplies ENSNode configuration to all child components.

```tsx
interface ENSNodeProviderProps {
  config: ENSNodeConfig;
  queryClient?: QueryClient;
  queryClientOptions?: QueryClientOptions;
}
```

#### Props

- `config`: ENSNode configuration object
- `queryClient`: Optional TanStack Query client instance (requires manual QueryClientProvider setup)
- `queryClientOptions`: Optional Custom options for auto-created QueryClient (only used when queryClient is not provided)

### createConfig

Helper function to create ENSNode configuration with defaults.

```tsx
const config = createConfig({
  url: "https://api.alpha.ensnode.io",
});
```

### `useRecords`

Hook for resolving records for an ENS name (Forward Resolution).

#### Parameters

- `name`: The ENS Name whose records to resolve
- `selection`: Optional selection of Resolver records
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve
- `query`: Optional TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = useRecords({
  name: "example.eth",
  selection: {
    addresses: [60], // ETH
    texts: ["avatar", "description", "url"],
  },
  query: {
    staleTime: 60000, // 1 minute
  },
});
```

### `usePrimaryName`

Hook for resolving the primary name of a specified address (Reverse Resolution).

#### Parameters

- `address`: The Address whose Primary Name to resolve
- `chainId`: The chain id within which to query the address' ENSIP-19 Multichain Primary Name
- `query`: TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = usePrimaryName({
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  chainId: 10, // Optimism
});
```

## Advanced Usage

### Custom Query Configuration

The `ENSNodeProvider` automatically creates and manages a QueryClient for you. Cache keys include the ENSNode endpoint URL, so different endpoints (mainnet vs testnet) maintain separate caches. You can customize the QueryClient without importing TanStack Query:

```tsx
// Simple setup - no TanStack Query knowledge needed
<ENSNodeProvider
  config={config}
  queryClientOptions={{
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
        retry: 5,
      },
    },
  }}
>
  <App />
</ENSNodeProvider>
```

### Advanced: Bring Your Own QueryClient

If you need full control over TanStack Query, you can provide your own `QueryClient`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 5,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <ENSNodeProvider config={config} queryClient={queryClient}>
    <App />
  </ENSNodeProvider>
</QueryClientProvider>;
```

TanStack Query v5+ is used internally. Hook return types are TanStack Query's `UseQueryResult` for full compatibility, but you don't need to interact with TanStack Query directly unless you want advanced customization.

### Conditional Queries

Queries only execute if all required variables are provided:

```tsx
const [address, setAddress] = useState("");

// only executes when address is not null
const { data } = usePrimaryName({
  address: address || null,
  chainId: 1
});
```

You can also conditionally enable/disable queries based on your own logic:

```tsx
const [showPrimaryName, setShowPrimaryName] = useState(false);

// will not execute until `showPrimaryName` is true
const { data } = usePrimaryName({
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  chainId: 1,
  query: { enabled: showPrimaryName },
});
```

### Multichain Reverse Resolution

ENS supports [Multichain Primary Names](https://docs.ens.domains/ensip/19/), and ENSNode supports
resolving the Primary Name of an address within the context of a specific `chainId`.

```tsx
function ShowMultichainPrimaryNames({ address }: { address: Address }) {
  const mainnet = usePrimaryName({ address, chainId: 1 });
  const optimism = usePrimaryName({ address, chainId: 10 });
  const polygon = usePrimaryName({ address, chainId: 137 });

  return (
    <div>
      <div>Mainnet: {mainnet.data?.records.name || "None"}</div>
      <div>Optimism: {optimism.data?.records.name || "None"}</div>
      <div>Polygon: {polygon.data?.records.name || "None"}</div>
    </div>
  );
}
```

### Error Handling

Use the `error` and `isError` result parameters to handle error states in your application.

```tsx
const { data, error, isError } = useRecords({ name: "vitalik.eth" });

if (isError) {
  return <div>Failed to resolve: {error.message}</div>;
}
```
