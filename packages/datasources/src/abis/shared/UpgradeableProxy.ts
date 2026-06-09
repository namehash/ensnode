/**
 * Minimal ABI for EIP-1967 upgradeable proxies.
 *
 * Captures only the `Upgraded(address indexed implementation)` event, emitted by transparent/UUPS
 * proxies whenever their implementation slot changes. ENSIndexer watches this on known proxy
 * Resolver contracts to re-classify `supportsInterface`-derived metadata (e.g. `Resolver.extended`)
 * after a post-assignment upgrade activates an interface.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1967
 */
export const UpgradeableProxy = [
  {
    type: "event",
    name: "Upgraded",
    inputs: [{ name: "implementation", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },
] as const;
