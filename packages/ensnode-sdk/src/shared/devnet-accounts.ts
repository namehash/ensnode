/**
 * Named accounts from the ens-test-env devnet.
 * They are NOT real Ethereum Mainnet or testnet addresses.
 * You can use `docker compose up devnet` to see actual data in devnet
 *
 * @see https://github.com/ensdomains/ens-test-env
 */

import { toNormalizedAddress } from "enssdk";

export const DEVNET_DEPLOYER = toNormalizedAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
export const DEVNET_OWNER = toNormalizedAddress("0x70997970c51812dc3a010c7d01b50e0d17dc79c8");
export const DEVNET_USER = toNormalizedAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
export const DEVNET_USER2 = toNormalizedAddress("0x90F79bf6EB2c4f870365E785982E1f101E93b906");
