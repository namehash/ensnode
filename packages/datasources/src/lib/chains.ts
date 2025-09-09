import { Chain, localhost } from "viem/chains";

/**
 * The Namechain Devnet Default L2 Chain Id
 * @see https://github.com/ensdomains/namechain/blob/26ad1550f6a119728d56f96b70326e42d6a4bdde/contracts/script/setup.ts#L47
 */
const l2ChainId = 0xeeeeee;

/**
 * The Namechain Devnet Default L1 Chain Id
 * @see https://github.com/ensdomains/namechain/blob/26ad1550f6a119728d56f96b70326e42d6a4bdde/contracts/script/setup.ts#L48
 */
const l1ChainId = l2ChainId - 1;

export const ensTestEnvL1Chain = {
  ...localhost,
  id: l1ChainId,
  name: "ens-test-env L1",
} satisfies Chain;

export const ensTestEnvL2Chain = {
  ...localhost,
  id: l2ChainId,
  name: "ens-test-env L2",
} satisfies Chain;
