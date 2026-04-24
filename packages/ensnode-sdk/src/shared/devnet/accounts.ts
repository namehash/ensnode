/**
 * Named accounts from the ens-test-env devnet.
 * Derived from the standard Hardhat mnemonic at account indices 0–3.
 * They are NOT real Ethereum Mainnet or testnet addresses.
 *
 * @see https://github.com/ensdomains/ens-test-env
 * @see https://github.com/ensdomains/contracts-v2/blob/42f2016e7ba87eb3854afe51ad55186a16b32a74/contracts/script/setup.ts#L55
 */

import { toNormalizedAddress } from "enssdk";

/**
 * Standard Hardhat/Anvil mnemonic used by the ens-test-env devnet.
 */
export const DEVNET_MNEMONIC = "test test test test test test test test test test test junk";

export const DEVNET_ACCOUNTS = {
  /** Account index 0 — has REGISTRAR role on ETHRegistry */
  deployer: toNormalizedAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
  /** Account index 1 — owns test.eth */
  owner: toNormalizedAddress("0x70997970c51812dc3a010c7d01b50e0d17dc79c8"),
  /** Account index 2 */
  user: toNormalizedAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"),
  /** Account index 3 */
  user2: toNormalizedAddress("0x90F79bf6EB2c4f870365E785982E1f101E93b906"),
} as const;
