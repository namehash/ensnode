import { Chain, localhost } from "viem/chains";

const l2ChainId = 0xeeeeee;
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
