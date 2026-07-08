import type { InterpretedName } from "enssdk";

import type { ResolverRecordsResponseBase } from "@ensnode/ensnode-sdk";

/** Resolved records for a name, including resolution identity and record payload. */
export type ResolvedRecordsModel = {
  name: InterpretedName;
  records: Partial<ResolverRecordsResponseBase>;
};

/** Forward-resolution outcome carrying {@link ResolvedRecordsModel}. */
export type ResolvedRecordsResultModel = ResolvedRecordsModel;

export const toResolvedRecordsModel = (
  name: InterpretedName,
  response: Partial<ResolverRecordsResponseBase>,
): ResolvedRecordsModel => ({
  name,
  records: response,
});
