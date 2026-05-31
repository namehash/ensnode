import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

export const profileRecordsModel = (
  texts?: Record<string, string | null>,
  addresses?: Record<number, string | null>,
): ResolvedRecordsModel => ({
  id: "test.eth" as ResolvedRecordsModel["id"],
  texts: texts ?? {},
  addresses: addresses ?? {},
});
