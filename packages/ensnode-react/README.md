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

That's it! No need to wrap with `QueryClientProvider` or create a `QueryClient` - it's all handled automatically. Each ENSNode endpoint gets its own isolated cache for proper data separation.

### 2. Use the Hooks

#### Forward Resolution (Name to Records)

```tsx
import { useResolveName } from "@ensnode/ensnode-react";

function NameResolver() {
  const { data, isLoading, error } = useResolveName({
    name: "vitalik.eth",
    selection: {
      addresses: [60], // ETH
      texts: ["avatar", "com.twitter"],
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;

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

#### Reverse Resolution (Address to Name)

```tsx
import { useResolveAddress } from "@ensnode/ensnode-react";

function AddressResolver() {
  const { data, isLoading, error } = useResolveAddress({
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

### useResolveName

Hook for forward resolution (ENS name to records).

```tsx
function useResolveName(
  parameters: UseResolveNameParameters
): UseResolveNameReturnType;
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
const { data, isLoading, error, refetch } = useResolveName({
  name: "example.eth",
  selection: {
    addresses: [60, 0], // ETH and BTC
    texts: ["avatar", "description", "url"],
  },
  query: {
    enabled: true,
    staleTime: 60000, // 1 minute
  },
});
```

### useResolveAddress

Hook for reverse resolution (address to primary name).

```tsx
function useResolveAddress(
  parameters: UseResolveAddressParameters
): UseResolveAddressReturnType;
```

#### Parameters

- `address`: The address to resolve
- `chainId`: Optional chain ID (defaults to 1 for Ethereum mainnet)
- `query`: TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = useResolveAddress({
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  chainId: 10, // Optimism
  query: {
    enabled: true,
    retry: 2,
  },
});
```

### useENSNodeConfig

Hook to access the ENSNode configuration from context.

```tsx
const config = useENSNodeConfig();
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

You can conditionally enable/disble queries:

```tsx
const [address, setAddress] = useState("");
const { data } = useResolveAddress({
  address,
  query: {
    enabled: Boolean(address), // Only run when address is set
  },
});
```

### Multichain Reverse Resolution

Resolve primary names for an address on different chains:

```tsx
function MultiChainResolver({ address }: { address: string }) {
  const mainnet = useResolveAddress({ address, chainId: 1 });
  const optimism = useResolveAddress({ address, chainId: 10 });
  const polygon = useResolveAddress({ address, chainId: 137 });

  return (
    <div>
      <div>Mainnet: {mainnet.data?.records.name || "None"}</div>
      <div>Optimism: {optimism.data?.records.name || "None"}</div>
      <div>Polygon: {polygon.data?.records.name || "None"}</div>
    </div>
  );
}
```

### Multiple ENSNode Endpoints

Use different ENSNode endpoints with automatic cache isolation:

```tsx
// Mainnet provider
const mainnetConfig = createConfig({
  url: "https://api.mainnet.ensnode.io",
});

// Testnet provider
const testnetConfig = createConfig({
  url: "https://api.alpha-sepolia.ensnode.io",
});

function MainnetData() {
  const { data } = useResolveAddress({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  });
  return <div>Mainnet: {data?.records.name}</div>;
}

function TestnetData() {
  const { data } = useResolveAddress({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  });
  return <div>Testnet: {data?.records.name}</div>;
}

function App() {
  return (
    <div>
      <ENSNodeProvider config={mainnetConfig}>
        <MainnetData />
      </ENSNodeProvider>

      <ENSNodeProvider config={testnetConfig}>
        <TestnetData />
      </ENSNodeProvider>
    </div>
  );
}
```

### Error Handling

```tsx
const { data, error, isError } = useResolveName({ name: "vitalik.eth" });

if (isError) {
  return <div>Failed to resolve: {error.message}</div>;
}
```

## TypeScript

This package is written in TypeScript and exports all necessary types. Hook return types are directly compatible with TanStack Query's `UseQueryResult`:

```tsx
import type {
  ENSNodeConfig,
  UseResolveNameParameters,
  UseResolveAddressParameters,
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
} from "@ensnode/ensnode-react";

// Hook return types are TanStack Query's UseQueryResult
// so they work seamlessly with TanStack Query utilities
import type { UseQueryResult } from "@tanstack/react-query";
type NameResult = UseQueryResult<ForwardResponse>; // Same as UseResolveNameReturnType
```
