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
      addresses: [60], // ETH CoinType
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
import { mainnet } from "viem/chains";
import { usePrimaryName } from "@ensnode/ensnode-react";

function DisplayPrimaryName() {
  const { data, isLoading, error } = usePrimaryName({
    address: "0x179A862703a4adfb29896552DF9e307980D19285",
    chainId: mainnet.id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Primary Name (for Mainnet)</h3>
      <p>{data.name ?? "No Primary Name"}</p>
    </div>
  );
}
```

#### Primary Names Resolution — `usePrimaryNames`

```tsx
import { mainnet } from "viem/chains";
import { usePrimaryNames } from "@ensnode/ensnode-react";

function DisplayPrimaryNames() {
  const { data, isLoading, error } = usePrimaryNames({
    address: "0x179A862703a4adfb29896552DF9e307980D19285",
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {Object.entries(data.names).map(([chainId, name]) => (
        <div key={chainId}>
          <h3>Primary Name (Chain Id: {chainId})</h3>
          <p>{name}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Avatar URL Resolution — `useAvatarUrl`

```tsx
import { useAvatarUrl } from "@ensnode/ensnode-react";

function ProfileAvatar({ name }: { name: string }) {
  const { data, isLoading } = useAvatarUrl({ name });

  if (isLoading || !data) {
    return <div className="avatar-loading" />;
  }

  return (
    <div className="avatar">
      {!data.browserSupportedAvatarUrl ? (
        <div className="avatar-fallback" />
      ) : (
        <img
          src={data.browserSupportedAvatarUrl.toString()}
          alt={`${name} avatar`}
        />
      )}
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

Hook that resolves records for an ENS name (Forward Resolution), via ENSNode, which implements Protocol Acceleration for indexed names.

The returned `name` field, if set, is guaranteed to be a normalized name. If the name record returned by the resolver is not normalized, `null` is returned as if no name record was set.

#### Parameters

- `name`: The ENS Name whose records to resolve
- `selection`: Selection of Resolver records to resolve
  - `addresses`: Array of coin types to resolve addresses for
  - `texts`: Array of text record keys to resolve
- `trace`: (optional) Whether to include a trace in the response (default: false)
- `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)
- `query`: (optional) TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = useRecords({
  name: "example.eth",
  selection: {
    addresses: [60], // ETH
    texts: ["avatar", "description", "url"],
  },
});
```

### `usePrimaryName`

Hook that resolves the primary name of the provided `address` on the specified `chainId`, via ENSNode, which implements Protocol Acceleration for indexed names. If the chainId-specific Primary Name is not defined, but the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default Name will be returned. You _may_ query the Default EVM Chain Id (`0`) in order to determine the `address`'s Default Name directly.

The returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name). If the primary name set for the address is not normalized, `null` is returned as if no primary name was set.

#### Parameters

- `address`: The Address whose Primary Name to resolve
- `chainId`: The chain id within which to query the address' ENSIP-19 Multichain Primary Name
- `trace`: (optional) Whether to include a trace in the response (default: false)
- `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)
- `query`: (optional) TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = usePrimaryName({
  address: "0x179A862703a4adfb29896552DF9e307980D19285",
  chainId: 10, // Optimism
});
```

### `usePrimaryNames`

Hook that resolves the primary names of the provided `address` on the specified chainIds, via ENSNode, which implements Protocol Acceleration for indexed names. For each Primary Name, if the chainId-specific Primary Name is not defined, but the `address` specifies a valid [ENSIP-19 Default Name](https://docs.ens.domains/ensip/19/#default-primary-name), the Default Name will be returned. You _may not_ query the Default EVM Chain Id (`0`) directly, and should rely on the aforementioned per-chain defaulting behavior.

Each returned Primary Name, if set, is guaranteed to be a [Normalized Name](https://ensnode.io/docs/reference/terminology#normalized-name). If the primary name set for the address on any chain is not normalized, `null` is returned for that chain as if no primary name was set.

#### Parameters

- `address`: The Address whose Primary Names to resolve
- `chainIds`: (optional) Array of chain ids to query the address' ENSIP-19 Multichain Primary Names (default: all ENSIP-19 supported chains)
- `trace`: (optional) Whether to include a trace in the response (default: false)
- `accelerate`: (optional) Whether to attempt Protocol Acceleration (default: false)
- `query`: (optional) TanStack Query options for customization

#### Example

```tsx
const { data, isLoading, error, refetch } = usePrimaryNames({
  address: "0x179A862703a4adfb29896552DF9e307980D19285",
});
```

### `useAvatarUrl`

Hook that resolves the avatar URL for an ENS name. This hook automatically handles the avatar text record resolution and provides browser-compatible URLs.

#### Resolution Flow

The hook follows this resolution process:

1. **Fetches the avatar text record** using `useRecords` internally
2. **Normalizes the avatar text record** as a URL
3. **Returns the URL directly** if it uses http or https protocol
4. **Falls back to ENS Metadata Service** (or custom fallback) for non-http/https protocols (e.g., `ipfs://`, `ar://`, `eip155://`)

The ENS Metadata Service acts as a proxy, converting decentralized storage protocols like IPFS and Arweave to browser-accessible URLs.

#### Invariants

- **If `rawAvatarUrl` is `null`, then `browserSupportedAvatarUrl` must also be `null`**
- The `browserSupportedAvatarUrl` is guaranteed to use http or https protocol when non-null
- The `fromFallback` flag is `true` only when a fallback successfully resolved the URL

#### Parameters

- `name`: The ENS Name whose avatar URL to resolve (set to `null` to disable the query)
- `browserUnsupportedProtocolFallback`: (optional) Custom fallback function for non-http/https protocols. Must return a `BrowserSupportedAssetUrl` created using `toBrowserSupportedUrl()` or from `buildEnsMetadataServiceAvatarUrl()`. Defaults to using the ENS Metadata Service.
- `query`: (optional) TanStack Query options for customization

#### Return Value

```tsx
interface UseAvatarUrlResult {
  rawAvatarUrl: string | null;
  browserSupportedAvatarUrl: BrowserSupportedAssetUrl | null;
  fromFallback: boolean;
}
```

- `rawAvatarUrl`: The original avatar text record value from ENS, before any normalization or fallback processing. `null` if no avatar text record is set.
- `browserSupportedAvatarUrl`: A browser-supported (http/https) avatar URL ready for use in `<img>` tags. `null` if no avatar is set, or if the avatar uses a non-http/https protocol and the fallback fails to resolve.
- `fromFallback`: Indicates whether the `browserSupportedAvatarUrl` was obtained via the fallback mechanism.

<details>
<summary><strong>Basic Example</strong></summary>

```tsx
import { useAvatarUrl } from "@ensnode/ensnode-react";

function ProfileAvatar({ name }: { name: string }) {
  const { data, isLoading } = useAvatarUrl({ name });

  if (isLoading || !data) {
    return <div className="avatar-loading" />;
  }

  return (
    <div className="avatar">
      {!data.browserSupportedAvatarUrl ? (
        <div className="avatar-fallback">No avatar</div>
      ) : (
        <img
          src={data.browserSupportedAvatarUrl.toString()}
          alt={`${name} avatar`}
        />
      )}
    </div>
  );
}
```

</details>

<details>
<summary><strong>Advanced Example with Loading States</strong></summary>

```tsx
import { useAvatarUrl } from "@ensnode/ensnode-react";
import { useState } from "react";

function EnsAvatar({ name }: { name: string }) {
  const [imageLoadingStatus, setImageLoadingStatus] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const { data: avatarUrlData, isLoading: isAvatarUrlLoading } = useAvatarUrl({
    name,
  });

  // Show loading state while fetching avatar URL
  if (isAvatarUrlLoading || !avatarUrlData) {
    return <div className="h-12 w-12 rounded-full animate-pulse bg-gray-200" />;
  }

  // No avatar available - show fallback
  if (avatarUrlData.browserSupportedAvatarUrl === null) {
    return (
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600" />
    );
  }

  const avatarUrl = avatarUrlData.browserSupportedAvatarUrl;

  return (
    <div className="relative h-12 w-12">
      <img
        src={avatarUrl.toString()}
        alt={`${name} avatar`}
        className="h-full w-full rounded-full object-cover"
        onLoad={() => setImageLoadingStatus("loaded")}
        onError={() => setImageLoadingStatus("error")}
      />

      {/* Show loading state while image is loading */}
      {(imageLoadingStatus === "idle" || imageLoadingStatus === "loading") && (
        <div className="absolute inset-0 rounded-full animate-pulse bg-gray-200" />
      )}

      {/* Show fallback if image fails to load */}
      {imageLoadingStatus === "error" && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-600" />
      )}
    </div>
  );
}
```

</details>

<details>
<summary><strong>Custom Fallback Example</strong></summary>

```tsx
import {
  useAvatarUrl,
  buildEnsMetadataServiceAvatarUrl,
  toBrowserSupportedUrl,
} from "@ensnode/ensnode-react";

function ProfileAvatar({
  name,
  namespaceId,
}: {
  name: string;
  namespaceId: string;
}) {
  const { data, isLoading } = useAvatarUrl({
    name,
    browserUnsupportedProtocolFallback: async (name) => {
      // Option 1: Use ENS Metadata Service for a specific namespace
      return buildEnsMetadataServiceAvatarUrl(name, namespaceId);

      // Option 2: Use your own custom IPFS gateway
      // const avatarRecord = /* get from somewhere */;
      // if (avatarRecord.startsWith('ipfs://')) {
      //   const ipfsHash = avatarRecord.replace('ipfs://', '');
      //   return toBrowserSupportedUrl(`https://my-gateway.io/ipfs/${ipfsHash}`);
      // }
      // return null;
    },
  });

  if (isLoading || !data) {
    return <div className="avatar-loading" />;
  }

  return (
    <div className="avatar">
      {!data.browserSupportedAvatarUrl ? (
        <div className="avatar-fallback" />
      ) : (
        <>
          <img
            src={data.browserSupportedAvatarUrl.toString()}
            alt={`${name} avatar`}
          />
          {data.fromFallback && <span className="badge">Via Fallback</span>}
        </>
      )}
    </div>
  );
}
```

</details>

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
  chainId: 1,
});
```

You can also conditionally enable/disable queries based on your own logic:

```tsx
const [showPrimaryName, setShowPrimaryName] = useState(false);

// will not execute until `showPrimaryName` is true
const { data } = usePrimaryName({
  address: "0x179A862703a4adfb29896552DF9e307980D19285",
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
