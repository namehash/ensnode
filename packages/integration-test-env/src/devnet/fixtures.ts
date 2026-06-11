import { type CoinName, getCoderByCoinName } from "@ensdomains/address-encoder";
import { bytesToHex } from "@ensdomains/address-encoder/utils";
import type { CoinType, NormalizedAddress } from "enssdk";
import { asNormalizedAddress, toNormalizedAddress } from "enssdk";
import type { Hex } from "viem";
import { mnemonicToAccount } from "viem/accounts";

/**
 * Must match the devnet mnemonic in contracts-v2 (Anvil named accounts).
 * @see https://github.com/ensdomains/contracts-v2/blob/69bde1b345c47caf3d55a105b9f922280ba55f00/contracts/script/setup.ts#L56
 */
const mnemonic = "test test test test test test test test test test test junk";

function createAccount(addressIndex: number, resolver: NormalizedAddress) {
  const account = mnemonicToAccount(mnemonic, { addressIndex });
  return {
    ...account,
    address: toNormalizedAddress(account.address),
    resolver,
  };
}

/**
 * Named accounts from the ens-test-env devnet.
 * They are NOT real Ethereum Mainnet or testnet addresses.
 * You can use `pnpm devnet` to see actual data in devnet
 *
 * @see https://github.com/ensdomains/ens-test-env
 */
export const accounts = {
  deployer: createAccount(0, asNormalizedAddress("0x9c97ec2d79944fa55aa2eb6385bc8711cacf18d2")),
  owner: createAccount(1, asNormalizedAddress("0x8550d35164e7f86bb6adf4cedb3f012913c9d563")),
  user: createAccount(2, asNormalizedAddress("0x98a84b915ffe27241033ac8f29c6b7849a0fb6e4")),
  user2: createAccount(3, asNormalizedAddress("0xd04f8f3726a417cfadeea604fc94cf66112b9af6")),
} as const;

/**
 * Fixtures for seeding the devnet with test data.
 */
export const addresses = {
  one: asNormalizedAddress(`0x${"1".repeat(40)}`),
} as const satisfies Record<string, NormalizedAddress>;

const getRawAddress = (coinName: CoinName, address: string) => {
  const coder = getCoderByCoinName(coinName);
  return {
    coinType: coder.coinType,
    raw: bytesToHex(coder.decode(address)),
    address,
  };
};

/**
 * Text records seeded on `test.eth` (PermissionedResolver) in the ens-test-env devnet.
 * @see packages/integration-test-env/src/seed/resolver-records.ts
 */
export const testEthTextRecords = {
  avatar: { key: "avatar", value: "https://example.com/avatar.png" },
  twitter: { key: "com.twitter", value: "ensdomains" },
  github: { key: "com.github", value: "@ensdomains" },
  x: { key: "com.x", value: "this_is_real_ensdomains_not_twitter_but_x_haha" },
  telegram: { key: "org.telegram", value: "t.me/ensdomains" },
  url: { key: "url", value: "https://ens.domains" },
  email: { key: "email", value: "test@ens.domains" },
  description: { key: "description", value: "test.eth" },
  header: { key: "header", value: "https://example.com/header.png" },
} as const;

const rawAddresses = {
  bitcoin: getRawAddress("btc", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
  litecoin: getRawAddress("ltc", "LaMT348PWRnrqeeWArpwQPbuanpXDZGEUz"),
  dogecoin: getRawAddress("doge", "DBXu2kgc3xtvCUWFcxFE3r9hEYgmuaaCyD"),
  monacoin: getRawAddress("mona", "MHxgS2XMXjeJ4if2PRRbWYcdwZPWfdwaDT"),
  rootstock: getRawAddress("rbtc", "0x5aaEB6053f3e94c9b9a09f33669435E7ef1bEAeD"),
  binance: getRawAddress("bnb", "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2"),
  solana: getRawAddress("sol", "FncazAs6omJJjtLVzquzT9KoyXn6tFixr9kGjr42ktLj"),
} as const satisfies Record<string, { coinType: CoinType; raw: Hex }>;

/**
 * An effective-Resolver fallback fixture: `noresolver.parent.eth` is seeded WITHOUT a Resolver under
 * `parent.eth` (which has the PermissionedResolver), so its _effective_ Resolver resolves — via
 * ENSIP-10 fallback — to `parent.eth`'s Resolver.
 * @see packages/integration-test-env/src/seed/effective-resolver-fallback.ts
 */
export const effectiveResolverFallback = {
  parentLabel: "parent",
  parentName: "parent.eth",
  subnameLabel: "noresolver",
  subname: "noresolver.parent.eth",
} as const;

export const fixtures = {
  abiBytes: `0x${"01".repeat(32)}`,
  fourBytesInterface: "0x11100111",
  publicKeyX: `0x${"02".repeat(32)}`,
  publicKeyY: `0x${"03".repeat(32)}`,
  contenthash: `0x${"04".repeat(32)}`,

  rawAddresses: rawAddresses,
  textRecords: testEthTextRecords,
} as const;

/**
 * Synthetic EFP follow targets used by the integration EFP seeder (`seed/efp.ts`) and the EFP
 * integration tests. Each anchors a distinct seeded record so tests can look it up by `recordData`;
 * none has any indexed ENS presence, so they exercise that `EfpListRecord.account` still resolves to
 * an Account for an arbitrary address.
 */
export const efpSeedTargets = {
  /** ADD + ADD_TAG("block") + ADD_TAG("block") -> tags === ["block"] (dedup). */
  dedup: asNormalizedAddress(`0x${"d1".repeat(20)}`),
  /** ADD + ADD_TAG("vip") + REMOVE + ADD -> record present, tags === [] (embed cascade + fresh). */
  cascade: asNormalizedAddress(`0x${"ca".repeat(20)}`),
  /** ADD + REMOVE(target + junk) -> record gone (canonical 22-byte keying). */
  junk: asNormalizedAddress(`0x${"1c".repeat(20)}`),
  /** Anchors a list whose `user` role must survive a storage-location re-point away and back. */
  durable: asNormalizedAddress(`0x${"d0".repeat(20)}`),
} as const satisfies Record<string, NormalizedAddress>;

/** The `user` role set on the {@link efpSeedTargets.durable} list, re-derived after the re-point. */
export const efpSeedRoleUser = asNormalizedAddress(`0x${"ab".repeat(20)}`);

/**
 * The Anvil account (mnemonic index 6) the EFP seeder mints its lists from. It has `primary-list`
 * metadata (set by easyMintTo) but its lists' `user` is never itself, so it exercises the
 * `primaryList` two-step validation's mismatch (rejection) branch.
 */
export const efpSeedActorAddress = asNormalizedAddress(
  "0x976ea74026e726554db657fa54763abd0c3a0aa9",
);
