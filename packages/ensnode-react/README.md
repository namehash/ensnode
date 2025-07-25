# ENSNode React

React hooks and provider for ENSNode API. This package provides a React-friendly interface to the ENSNode SDK with automatic caching, loading states, and error handling. **TanStack Query is handled automatically** - no setup required unless you want custom configuration.

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

const config = createConfig({
  url: "https://api.mainnet.ensnode.io",
  debug: false,
});

function App() {
  return (
    <ENSNodeProvider config={config}>
      <YourApp />
    </ENSNodeProvider>
  );
}
```

That's it! No need to wrap with `QueryClientProvider` or create a `QueryClient` - it's all handled automatically.

### 2. Use the Hooks

#### Forward Resolution (Name to Records)

```tsx
import { useName } from "@ensnode/ensnode-react";

function NameResolver() {
  const { data, isLoading, error } = useName({
    name: "vitalik.eth",
    selection: {
      name: true,
      addresses: [60], // ETH
      texts: ["avatar", "com.twitter"],
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h3>Resolved Records for {data.records.name}</h3>
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

#### Reverse Resolution (Address to Name)

```tsx
import { useAddress } from "@ensnode/ensnode-react";

function AddressResolver() {
  const { data, isLoading, error } = useAddress({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chainId: 1, // Ethereum mainnet
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No primary name set</div>;

  return (
    <div>
      <h3>Primary Name</h3>
      <p>{data.records.name}</p>
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
- `queryClientOptions`: Custom options for auto-created QueryClient (only used when queryClient is not provided)

### createConfig

Helper function to create ENSNode configuration with defaults.

```tsx
const config = createConfig({
  url: "https://api.mainnet.ensnode.io",
  debug: true,
});
```

### useName

Hook for forward resolution (ENS name to records).

```tsx
function useName(parameters: UseNameParameters): UseNameReturnType;
```

#### Parameters

- `name`: The ENS name to resolve
- `selection`: Optional selection of what records to resolve
  - `name`: Include canonical name
  - `addresses`: Array of coin types to resolve
  - `texts`: Array of text record keys to resolve
- `query`: TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = useName({
  name: "example.eth",
  selection: {
    name: true,
    addresses: [60, 0], // ETH and BTC
    texts: ["avatar", "description", "url"],
  },
  query: {
    enabled: true,
    staleTime: 60000, // 1 minute
  },
});
```

### useAddress

Hook for reverse resolution (address to primary name).

```tsx
function useAddress(parameters: UseAddressParameters): UseAddressReturnType;
```

#### Parameters

- `address`: The address to resolve
- `chainId`: Optional chain ID (defaults to 1 for Ethereum mainnet)
- `query`: TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = useAddress({
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  chainId: 10, // Optimism
  query: {
    enabled: true,
    retry: 2,
  },
});
```

### useConfig

Hook to access the ENSNode configuration from context.

```tsx
const config = useConfig();
```

## Advanced Usage

### Custom Query Configuration

The `ENSNodeProvider` automatically creates and manages a QueryClient for you. You can customize it without importing TanStack Query:

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

### Conditional Queries

You can conditionally enable/disble queries:

```tsx
const [address, setAddress] = useState("");
const { data } = useAddress({
  address,
  query: {
    enabled: Boolean(address), // Only run when address is set
  },
});
```

### Multiple Chain Resolution

Resolve names on different chains:

```tsx
function MultiChainResolver({ address }: { address: string }) {
  const mainnet = useAddress({ address, chainId: 1 });
  const optimism = useAddress({ address, chainId: 10 });
  const polygon = useAddress({ address, chainId: 137 });

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

```tsx
const { data, error, isError } = useName({ name: "invalid.eth" });

if (isError) {
  if (error.message.includes("Name not found")) {
    return <div>This name is not registered</div>;
  }
  return <div>Failed to resolve: {error.message}</div>;
}
```

## TypeScript

This package is written in TypeScript and exports all necessary types:

```tsx
import type {
  ENSNodeConfig,
  UseNameParameters,
  UseAddressParameters,
  UseNameReturnType,
  UseAddressReturnType,
} from "@ensnode/ensnode-react";
```

## Requirements

Note: TanStack Query v5+ is used internally but abstracted away. You don't need to interact with it directly unless you want advanced query customization.
