import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";
import { Hex } from "viem";

export const profileRecordsModel = (
  texts?: Record<string, string | null>,
  addresses?: Record<number, Hex | null>,
): ResolvedRecordsModel => ({
  id: "test.eth" as ResolvedRecordsModel["id"],
  texts: texts ?? {},
  addresses: addresses ?? {},
});
