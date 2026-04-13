import type { AccountId } from "enssdk";

import { builder } from "@/omnigraph-api/builder";

export const AccountIdRef = builder.objectRef<AccountId>("AccountId");
AccountIdRef.implement({
  description: "A CAIP-10 Account ID including chainId and address.",
  fields: (t) => ({
    chainId: t.expose("chainId", { type: "ChainId", nullable: false }),
    address: t.expose("address", { type: "Address", nullable: false }),
  }),
});

export const AccountIdInput = builder.inputType("AccountIdInput", {
  description: "A CAIP-10 Account ID including chainId and address.",
  fields: (t) => ({
    chainId: t.field({ type: "ChainId", required: true }),
    address: t.field({ type: "Address", required: true }),
  }),
});
