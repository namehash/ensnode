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
 * Real contenthash values for each supported codec, encoded as per ENSIP-7.
 * Values are taken from https://github.com/ensdomains/content-hash test vectors.
 *
 * @see https://github.com/ensdomains/content-hash/blob/master/src/index.test.ts
 */
export const contenthashFixtures = {
  ipfs: "0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f",
  swarm: "0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162",
  ipns: "0xe50101720024080112205cbd1cc86ac20d6640795809c2a185bb2504538a2de8076da5a6971b8acb4715",
  onion: "0xbc037a716b746c776934666563766f367269",
  onion3:
    "0xbd037035336c663537716f7679757677736336786e72707079706c79337674716d376c3670636f626b6d797173696f6679657a6e667535757164",
  skynet: "0x90b2c60508004007fd43b74149b31aacbbf2784e874d09b086bed15fd54cacff7120cce95372",
  arweave: "0x90b2ca05cacdf63edf2e0bb4eb5711dd38b0723aca5f3c4ab62ceeb7c1110740833d4894",
} as const satisfies Record<string, Hex>;

export type NameRecords = {
  contenthash?: Hex;
};

export type RegisteredName = {
  name: string;
  label: string;
  records?: NameRecords;
  subnames?: RegisteredSubname[];
};

export type RegisteredSubname = {
  label: string;
  name: string;
  records?: NameRecords;
};

/**
 * Names registered at seed time via the ETHRegistrar (2LDs) or UserRegistry (subnames),
 * together with the resolver records to seed on them.
 *
 * To add more names: append entries here. Seeding, DEVNET_NAMES, and tests pick them up
 * automatically — no other files need changing.
 */
export const registeredNames = [
  {
    name: "contenthash.eth",
    label: "contenthash",
    records: {},
    subnames: [
      {
        label: "ipfs",
        name: "ipfs.contenthash.eth",
        records: { contenthash: contenthashFixtures.ipfs },
      },
      {
        label: "swarm",
        name: "swarm.contenthash.eth",
        records: { contenthash: contenthashFixtures.swarm },
      },
      {
        label: "ipns",
        name: "ipns.contenthash.eth",
        records: { contenthash: contenthashFixtures.ipns },
      },
      {
        label: "onion",
        name: "onion.contenthash.eth",
        records: { contenthash: contenthashFixtures.onion },
      },
      {
        label: "onion3",
        name: "onion3.contenthash.eth",
        records: { contenthash: contenthashFixtures.onion3 },
      },
      {
        label: "skynet",
        name: "skynet.contenthash.eth",
        records: { contenthash: contenthashFixtures.skynet },
      },
      {
        label: "arweave",
        name: "arweave.contenthash.eth",
        records: { contenthash: contenthashFixtures.arweave },
      },
    ],
  },
] as const satisfies RegisteredName[];
