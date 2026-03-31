import { ENSNamespaceIds, type Name, type NamespaceSpecificValue } from "@ensnode/ensnode-sdk";

export const EXAMPLE_NAMES: NamespaceSpecificValue<Name[]> = {
  default: [
    "vitalik.eth",
    "gregskril.eth",
    "katzman.base.eth",
    "jesse.base.eth",
    "alain.linea.eth",
    "goinfrex.linea.eth",
    "gift.box",
    "barmstrong.cb.id",
    "argent.xyz",
    "lens.xyz",
    "🔥🔥🔥🔥🔥.eth",
  ],
  [ENSNamespaceIds.Sepolia]: [
    "gregskril.eth",
    "vitalik.eth",
    "myens.eth",
    "recordstest.eth",
    "arrondesean.eth",
    "decode.eth",
  ],
  [ENSNamespaceIds.EnsTestEnv]: [
    "alias.eth",
    "changerole.eth",
    "demo.eth",
    "example.eth",
    "linked.parent.eth",
    "parent.eth",
    "renew.eth",
    "reregister.eth",
    "sub1.sub2.parent.eth",
    "sub2.parent.eth",
    "test.eth",
    "wallet.linked.parent.eth",
  ],
};
