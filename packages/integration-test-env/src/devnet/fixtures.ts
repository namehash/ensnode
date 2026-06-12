import { type CoinName, getCoderByCoinName } from "@ensdomains/address-encoder";
import { bytesToHex } from "@ensdomains/address-encoder/utils";
import { type Codec, decode, encode } from "@ensdomains/content-hash";
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

const getRawContenthash = (codec: Codec, input: string) => {
  const encoded = encode(codec, input);
  return {
    raw: `0x${encoded}` as Hex,
    // decode normalizes values (e.g. IPFS CIDv0 input → CIDv1 decoded, IPNS peer id → base36 CID)
    decoded: decode(encoded),
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

  rawAddresses: rawAddresses,
  textRecords: testEthTextRecords,
} as const;

/**
 * Real contenthash values for each supported codec, encoded as per ENSIP-7.
 * Input values are taken from https://github.com/ensdomains/content-hash test vectors.
 * The `raw` field is the ENSIP-7 encoded hex; `decoded` is the human-readable value.
 *
 * @see https://github.com/ensdomains/content-hash/blob/master/src/index.test.ts
 */
export const contenthashFixtures = {
  // CIDv0 input — decodes back to CIDv1
  ipfs: getRawContenthash("ipfs", "QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4"),
  swarm: getRawContenthash(
    "swarm",
    "d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162",
  ),
  ipns: getRawContenthash("ipns", "12D3KooWG4NvqQVczTrWY1H2tvsJmbQf5bbA3xGYXC4FM3wWCfE4"),
  onion: getRawContenthash("onion", "zqktlwi4fecvo6ri"),
  onion3: getRawContenthash("onion3", "p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd"),
  skynet: getRawContenthash("skynet", "CABAB_1Dt0FJsxqsu_J4TodNCbCGvtFf1Uys_3EgzOlTcg"),
  arweave: getRawContenthash("arweave", "ys32Pt8uC7TrVxHdOLByOspfPEq2LO63wREHQIM9SJQ"),
  empty: { raw: "0x", decoded: null },
  invalid: { raw: "0xdeadbeef", decoded: null },
  zero: {
    raw: "0x0000000000000000000000000000000000000000000000000000000000000000",
    decoded: null,
  },
} as const;

export type NameRecords = {
  contenthash: Hex | null;
};

type ENSv1RegisteredName = {
  type: "ENSv1";
  name: string;
  label: string;
  /**
   * When true, register via LegacyETHRegistrarController then NameWrapper.wrapETH2LD so
   * NameWrapped heals the label. When false, legacy registration only — unhealed
   * (`[labelhash].eth` canonical name).
   */
  wrapped: boolean;
  records?: NameRecords;
  reserved: boolean;
};

type ENSv2RegisteredName = {
  type: "ENSv2";
  name: string;
  label: string;
  records?: NameRecords;
  subnames?: RegisteredSubname[];
};

export type RegisteredName = ENSv1RegisteredName | ENSv2RegisteredName;

export type RegisteredSubname = {
  label: string;
  name: string;
  records?: NameRecords;
};

export const contenthashSubnames = Object.entries(contenthashFixtures).map(([label, fixture]) => ({
  label: label,
  name: `${label}.contenthash.eth`,
  records: { contenthash: fixture.raw },
})) satisfies RegisteredSubname[];

/**
 * Names registered at seed time via the ETHRegistrar (2LDs) or UserRegistry (subnames),
 * together with the resolver records to seed on them.
 *
 * To add more names: append entries here. Seeding, DEVNET_NAMES, and tests pick them up
 * automatically — no other files need changing.
 */
export const additionallyRegisteredNames = [
  {
    type: "ENSv2",
    name: "contenthash.eth",
    label: "contenthash",
    records: { contenthash: null },
    subnames: contenthashSubnames,
  },
  {
    type: "ENSv1",
    name: "legacy-v1-wrapped.eth",
    label: "legacy-v1-wrapped",
    wrapped: true,
    reserved: true,
  },
  {
    type: "ENSv1",
    name: "legacy-v1-unwrapped.eth",
    label: "legacy-v1-unwrapped",
    wrapped: false,
    reserved: true,
  },
  {
    type: "ENSv1",
    name: "legacy-v1-wrapped-unreserved.eth",
    label: "legacy-v1-wrapped-unreserved",
    wrapped: true,
    reserved: false,
  },
  {
    type: "ENSv2",
    name: "emptyrecords.eth",
    label: "emptyrecords",
    records: { contenthash: "0x" },
  },
] as const satisfies RegisteredName[];
