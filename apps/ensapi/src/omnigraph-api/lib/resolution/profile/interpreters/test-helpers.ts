import { asInterpretedName } from "enssdk";
import type { Hex } from "viem";

import type { ResolvedRecordsModel } from "@/omnigraph-api/lib/resolution/records-profile-model";

export const profileRecordsModel = (
  texts?: Record<string, string | null>,
  addresses?: Record<number, Hex | null>,
): ResolvedRecordsModel => ({
  name: asInterpretedName("test.eth"),
  records: {
    texts: texts ?? {},
    addresses: addresses ?? {},
  },
});
