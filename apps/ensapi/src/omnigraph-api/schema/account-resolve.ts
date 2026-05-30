import type { Address, CoinType, JsonValue } from "enssdk";

import type { TracingTrace } from "@ensnode/ensnode-sdk";

import { builder } from "@/omnigraph-api/builder";
import {
  normalizeAccountPrimaryNamesWhereInput,
  normalizePrimaryNameByInput,
} from "@/omnigraph-api/lib/resolution/primary-name-input";
import {
  type PrimaryNameRecordModel,
  PrimaryNameRecordRef,
} from "@/omnigraph-api/schema/primary-name-record";
import {
  AccelerationStatusRef,
  PrimaryNameByInput,
  PrimaryNamesWhereInput,
} from "@/omnigraph-api/schema/resolution";

export type AccountResolveModel = {
  address: Address;
  coinTypes: CoinType[];
  accelerate: boolean;
  canAccelerate: boolean;
  trace: TracingTrace;
  records: PrimaryNameRecordModel[];
};

export const AccountResolveRef = builder.objectRef<AccountResolveModel>("AccountResolve");

AccountResolveRef.implement({
  description:
    "Nested account resolution container exposing primary-name resolution with shared acceleration settings.",
  fields: (t) => ({
    trace: t.field({
      description:
        "Protocol trace tree emitted by primary-name resolution, represented as JSON for schema stability.",
      type: "JSON",
      nullable: false,
      resolve: (parent) => parent.trace as unknown as JsonValue,
    }),
    acceleration: t.field({
      description: "Protocol acceleration strategy status for this Account resolution.",
      type: AccelerationStatusRef,
      nullable: false,
      resolve: ({ accelerate, canAccelerate }) => ({
        requested: accelerate,
        attempted: accelerate && canAccelerate,
      }),
    }),
    primaryName: t.field({
      description: "The ENSIP-19 primary name for this Account on a specific coin type or chain.",
      type: PrimaryNameRecordRef,
      nullable: false,
      args: {
        by: t.arg({
          type: PrimaryNameByInput,
          required: true,
          description: "Select a coin type or chain to resolve a primary name for.",
        }),
      },
      resolve: ({ records, accelerate }, { by }) => {
        const coinType = normalizePrimaryNameByInput(by);
        const record = records.find((r) => r.coinType === coinType);
        if (!record) {
          throw new Error(`Missing primary name record for requested coin type: ${coinType}`);
        }
        return { ...record, accelerate };
      },
    }),
    primaryNames: t.field({
      description: "ENSIP-19 primary names for this Account on the requested coin types or chains.",
      type: [PrimaryNameRecordRef],
      nullable: false,
      args: {
        where: t.arg({
          type: PrimaryNamesWhereInput,
          required: true,
          description: "Select coin types or chains to resolve primary names for.",
        }),
      },
      resolve: ({ records, accelerate }, { where }) => {
        const coinTypes = normalizeAccountPrimaryNamesWhereInput(where);
        return coinTypes.map((coinType) => {
          const record = records.find((r) => r.coinType === coinType);
          if (!record) {
            throw new Error(`Missing primary name record for requested coin type: ${coinType}`);
          }
          return { ...record, accelerate };
        });
      },
    }),
  }),
});
