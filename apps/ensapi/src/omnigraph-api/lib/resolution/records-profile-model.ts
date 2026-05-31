import type { InterpretedName } from "enssdk";

import type { ResolverRecordsResponseBase } from "@ensnode/ensnode-sdk";

/** Cache key and resolution identity for {@link ResolvedRecordsRef}. */
export type ResolvedRecordsModel = Partial<ResolverRecordsResponseBase> & {
  id: InterpretedName;
};

export const toResolvedRecordsModel = (
  name: InterpretedName,
  response: Partial<ResolverRecordsResponseBase>,
): ResolvedRecordsModel => ({
  id: name,
  ...response,
});
