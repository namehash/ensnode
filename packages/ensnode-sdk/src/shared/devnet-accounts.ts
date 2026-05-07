/**
 * Named accounts from the ens-test-env devnet.
 * They are NOT real Ethereum Mainnet or testnet addresses.
 * You can use `docker compose up devnet` to see actual data in devnet
 *
 * @see https://github.com/ensdomains/ens-test-env
 */

import { toNormalizedAddress } from "enssdk";

export const DevnetAccounts = {
  deployer: {
    address: toNormalizedAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
    resolver: toNormalizedAddress("0x1F2Ce8886692b90F5754a7d428a2336800a5911B"),
  },
  owner: {
    address: toNormalizedAddress("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
    resolver: toNormalizedAddress("0x5eA90aCF6555276660760fE629D72932c91f4b8E"),
  },
  user: {
    address: toNormalizedAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"),
    resolver: toNormalizedAddress("0xB63aE54076C1c281Ec9395B290aDD470e69140c6"),
  },
  user2: {
    address: toNormalizedAddress("0x90F79bf6EB2c4f870365E785982E1f101E93b906"),
    resolver: toNormalizedAddress("0x5380066832977EB36353fd2B01fb92E751636b84"),
  },
} as const;
