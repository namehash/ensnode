# @ensnode/ensnode-react

React hooks and provider for ENSNode API. This package provides a React-friendly interface to the ENSNode SDK with automatic caching, loading states, error handling, and connection management. **TanStack Query is handled automatically** - no setup required unless you want custom configuration.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs/).

## Installation

```bash
npm install @ensnode/ensnode-react @ensnode/ensnode-sdk
```

Note: `@tanstack/react-query` is a peer dependency but you don't need to interact with it directly unless you want advanced query customization.

## Quick Start

### 1. Setup the Provider

#### Basic Setup (Fixed Endpoint)

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

#### Reactive Connection Management (Recommended)

Enable connection management for seamless endpoint switching:

```tsx
import { ENSNodeProvider, createConfig } from "@ensnode/ensnode-react";

const config = createConfig({
  url: "https://api.mainnet.ensnode.io",
  debug: false,
});

function App() {
  return (
    <ENSNodeProvider
      config={config}
      enableConnectionManagement={true}
      initialConnectionUrl="https://api.mainnet.ensnode.io"
    >
      <YourApp />
    </ENSNodeProvider>
  );
}
```

With `enableConnectionManagement={true}`, when you switch connections using `useConnections`, **ALL queries automatically switch to the new endpoint** - no manual config passing required!

That's it! No need to wrap with `QueryClientProvider` or create a `QueryClient` - it's all handled automatically. Each ENSNode endpoint gets its own isolated cache for proper data separation.

### 2. Use the Hooks

#### Forward Resolution (Name to Records)

```tsx
import { useResolveName } from "@ensnode/ensnode-react";

function NameResolver() {
  const { data, isLoading, error } = useResolveName({
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

## Configuration Types

This package distinguishes between two types of configuration:

### Client Configuration vs Connection Configuration

**Client Configuration (`ENSNodeConfig`)**

- Controls how the ENSNode SDK client behaves
- Includes endpoint URL, debug settings, request options
- Managed by `useENSNodeConfig()` and `ENSNodeProvider`
- Used for making API requests

**Connection Configuration (`ENSIndexerPublicConfig`)**

- Describes the capabilities and metadata of a specific ENSNode endpoint
- Fetched automatically from each endpoint during connection validation
- Includes supported chains, features, version info, etc.
- Managed by `useConnectionConfig()` and `useConnections()`
- Used for displaying endpoint information and feature detection

```tsx
// Client config - how to connect
const clientConfig = useENSNodeConfig();
console.log("Endpoint:", clientConfig.client.endpointUrl);

// Connection config - what the endpoint supports
const { config: connectionConfig } = useConnectionConfig();
console.log("Supported chains:", connectionConfig?.chains);
console.log("Features:", connectionConfig?.features);
```

## API Reference

### ENSNodeProvider

The provider component that supplies ENSNode configuration to all child components.

```tsx
interface ENSNodeProviderProps {
  config: ENSNodeConfig;
  queryClient?: QueryClient;
  queryClientOptions?: QueryClientOptions;
  enableConnectionManagement?: boolean;
  initialConnectionUrl?: string;
}
```

#### Props

- `config`: ENSNode configuration object
- `queryClient`: Optional TanStack Query client instance (requires manual QueryClientProvider setup)
- `queryClientOptions`: Custom options for auto-created QueryClient (only used when queryClient is not provided)
- `enableConnectionManagement`: Enable reactive connection switching (default: false)
- `initialConnectionUrl`: Initial connection URL when connection management is enabled

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

### useConnections

Hook for managing multiple ENSNode connections with add/remove functionality, localStorage persistence, and automatic ENSIndexer Public Config fetching.

```tsx
function useConnections(
  parameters: UseConnectionsParameters
): UseConnectionsReturnType;
```

#### Parameters

- `selectedUrl`: The currently selected ENSNode URL
- `defaultUrls`: Array of default connection URLs
- `storageKey`: Custom localStorage key (optional)

#### Example

```tsx
const {
  connections,
  currentUrl,
  setCurrentUrl,
  addConnection,
  removeConnection,
  isLoading,
} = useConnections({
  selectedUrl: "https://api.mainnet.ensnode.io",
  defaultUrls: [
    "https://api.mainnet.ensnode.io",
    "https://api.testnet.ensnode.io",
  ],
});

// Add a custom connection (automatically fetches and validates config)
await addConnection.mutateAsync({
  url: "https://my-custom-node.com",
});

// Switch connections
setCurrentUrl("https://api.testnet.ensnode.io");

// Remove a custom connection
await removeConnection.mutateAsync({
  url: "https://my-custom-node.com",
});
```

### useCurrentConnection

Hook for accessing and managing the current ENSNode connection.

```tsx
function useCurrentConnection(
  parameters?: UseCurrentConnectionParameters
): UseCurrentConnectionReturnType;
```

#### Example

```tsx
const { url, config, createConfigWithUrl } = useCurrentConnection();

console.log("Current endpoint:", url);

// Create config for different endpoint
const testnetConfig = createConfigWithUrl("https://api.testnet.ensnode.io");
```

### useConnectionConfig

Hook for accessing the ENSIndexer Public Config of the current or specified connection. This provides access to configuration data fetched from the ENSNode endpoint, separate from the client configuration.

```tsx
function useConnectionConfig(
  parameters?: UseConnectionConfigParameters
): UseConnectionConfigReturnType;
```

#### Parameters

- `url`: Optional URL to get config for a specific connection (defaults to current connection)

#### Example

```tsx
const { config, isLoading, error } = useConnectionConfig();

if (isLoading) return <div>Loading config...</div>;
if (error) return <div>Error: {error.message}</div>;
if (config) {
  return (
    <div>
      <h3>{config.name || "ENSNode"}</h3>
      <p>{config.description}</p>
      <p>Version: {config.version}</p>

      {config.chains && (
        <div>
          <h4>Supported Chains:</h4>
          {config.chains.map((chain) => (
            <div key={chain.chainId}>
              {chain.name} (ID: {chain.chainId})
            </div>
          ))}
        </div>
      )}

      {config.features && (
        <div>
          <h4>Features:</h4>
          <ul>
            {config.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
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

### Multiple Chain Resolution

Resolve names on different chains:

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

### Connection Management

#### Reactive Connection Management (Recommended)

With `enableConnectionManagement={true}`, switching connections automatically updates all queries:

```tsx
// Provider setup with connection management
<ENSNodeProvider config={config} enableConnectionManagement={true}>
  <App />
</ENSNodeProvider>;

function ConnectionSelector() {
  const {
    connections,
    currentUrl,
    setCurrentUrl,
    addConnection,
    removeConnection,
  } = useConnections({
    defaultUrls: [
      "https://api.mainnet.ensnode.io",
      "https://api.testnet.ensnode.io",
    ],
  });

  return (
    <div>
      <h3>ENSNode Connections</h3>
      {connections.map(({ url, isDefault, config }) => (
        <div key={url}>
          <button
            onClick={() => setCurrentUrl(url)} // 🚀 This switches ALL queries!
            className={url === currentUrl ? "active" : ""}
          >
            {config?.name || url} {isDefault && "(default)"}
          </button>
        </div>
      ))}
    </div>
  );
}

function DataDisplay() {
  const { config: connectionConfig } = useConnectionConfig();

  // 🎯 This automatically uses the current connection - no config passing needed!
  const { data } = useResolveAddress({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  });

  return (
    <div>
      <div>Connected to: {connectionConfig?.name || "Unknown"}</div>
      <div>Primary name: {data?.records.name}</div>
      {/* When you switch connections above, this data automatically updates! */}
    </div>
  );
}
```

#### Manual Connection Management

Without connection management, you need to manually pass configs:

```tsx
function ManualDataDisplay() {
  const { config } = useCurrentConnection();
  const { config: connectionConfig } = useConnectionConfig();

  // Must manually pass config for each query
  const { data } = useResolveAddress({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    config, // Manual config passing required
  });

  return (
    <div>
      <div>Node: {connectionConfig?.name || "Unknown"}</div>
      <div>Name: {data?.records.name}</div>
    </div>
  );
}
```

### Multiple ENSNode Endpoints

#### Option 1: Single Provider with Connection Management (Recommended)

Use one provider with connection switching for the best UX:

```tsx
const config = createConfig({ url: "https://api.mainnet.ensnode.io" });

function App() {
  return (
    <ENSNodeProvider config={config} enableConnectionManagement={true}>
      {/* Users can switch between mainnet/testnet dynamically */}
      <ConnectionSelector />
      <DataDisplay />
    </ENSNodeProvider>
  );
}
```

#### Option 2: Multiple Separate Providers

Use different ENSNode endpoints with automatic cache isolation:

```tsx
// Mainnet provider
const mainnetConfig = createConfig({
  url: "https://api.mainnet.ensnode.io",
});

// Testnet provider
const testnetConfig = createConfig({
  url: "https://api.testnet.ensnode.io",
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
const { data, error, isError } = useResolveName({ name: "invalid.eth" });

if (isError) {
  if (error.message.includes("Name not found")) {
    return <div>This name is not registered</div>;
  }
  return <div>Failed to resolve: {error.message}</div>;
}
```

## TypeScript

This package is written in TypeScript and exports all necessary types. Hook return types are directly compatible with TanStack Query's `UseQueryResult`:

```tsx
import type {
  ENSNodeConfig,
  ENSIndexerPublicConfig,
  ENSNodeValidator,
  ENSNodeProviderProps,
  ConnectionContextState,
  UseResolveNameParameters,
  UseResolveAddressParameters,
  UseResolveNameReturnType,
  UseResolveAddressReturnType,
  UseConnectionsParameters,
  UseConnectionsReturnType,
  UseCurrentConnectionParameters,
  UseCurrentConnectionReturnType,
  UseConnectionConfigParameters,
  UseConnectionConfigReturnType,
  Connection,
  AddConnectionVariables,
  RemoveConnectionVariables,
} from "@ensnode/ensnode-react";

// Hook return types are TanStack Query's UseQueryResult
// so they work seamlessly with TanStack Query utilities
import type { UseQueryResult } from "@tanstack/react-query";
type NameResult = UseQueryResult<ForwardResponse>; // Same as UseResolveNameReturnType

// Connection configuration types
type ConnectionConfig = ENSIndexerPublicConfig;
type ValidatorResult = Awaited<ReturnType<ENSNodeValidator["validate"]>>;
```

## Connection Management Modes

### Reactive Mode (Recommended)

- **Setup**: `<ENSNodeProvider enableConnectionManagement={true}>`
- **Behavior**: Switching connections automatically updates all queries
- **Use case**: Apps with connection switching UI
- **DX**: Excellent - everything "just works"

### Manual Mode

- **Setup**: `<ENSNodeProvider>` (default)
- **Behavior**: Fixed endpoint, manual config passing required
- **Use case**: Single endpoint apps, or when you need explicit control
- **DX**: Good - more explicit but requires more code

Choose reactive mode for the best developer experience when building connection management features!

## Requirements

Note: TanStack Query v5+ is used internally. Hook return types are TanStack Query's `UseQueryResult` for full ecosystem compatibility, but you don't need to interact with TanStack Query directly unless you want advanced customization.
