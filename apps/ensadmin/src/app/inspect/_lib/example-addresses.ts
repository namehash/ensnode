import { Address } from "viem";

import { ENSNamespaceIds, Name, NamespaceSpecificValue } from "@ensnode/ensnode-sdk";

export const EXAMPLE_ADDRESSES: NamespaceSpecificValue<Array<{ address: Address; name: Name }>> = {
  default: [
    { address: "0x2211d1D0020DAEA8039E46Cf1367962070d77DA9", name: "jesse.base.eth" },
    { address: "0x179A862703a4adfb29896552DF9e307980D19285", name: "gregskril.eth" },
    { address: "0xe7a863d7cdC48Cc0CcB135c9c0B4c1fafA3a2e69", name: "katzman.base.eth" },
    { address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", name: "vitalik.eth" },
  ],
  [ENSNamespaceIds.Sepolia]: [
    { address: "0xa3b4b3eef06c7ccefbbec72a4ab3444c2c9ecde6", name: "myens.eth" },
    { address: "0x6446ad9821021eeb9f85b8a18b0153d58166d161", name: "arrondesean.eth" },
    { address: "0xd325ee32f8170e29a8acaeec8b411072da901aef", name: "recordstest.eth" },
  ],
  [ENSNamespaceIds.EnsTestEnv]: [
    { address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", name: "deployer" },
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "owner" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "user" },
  ],
};
