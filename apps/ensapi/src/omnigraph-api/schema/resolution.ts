import { builder } from "@/omnigraph-api/builder";
import { ENSIP19_CHAIN_VALUES } from "@/omnigraph-api/lib/resolution/chain-coin-type";

//////////////////////
// AccelerationStatus
//////////////////////
export type AccelerationStatusModel = {
  requested: boolean;
  attempted: boolean;
};

export const AccelerationStatusRef =
  builder.objectRef<AccelerationStatusModel>("AccelerationStatus");

AccelerationStatusRef.implement({
  description: "Execution status metadata for a resolver strategy.",
  fields: (t) => ({
    requested: t.exposeBoolean("requested", {
      description: "Whether this strategy was requested by the caller.",
      nullable: false,
    }),
    attempted: t.exposeBoolean("attempted", {
      description: "Whether this strategy was attempted at runtime.",
      nullable: false,
    }),
  }),
});

//////////////////
// ENSIP19Chain
//////////////////
export const ENSIP19Chain = builder.enumType("ENSIP19Chain", {
  description:
    "ENSIP-19 supported chains that can have a primary name. Use `DEFAULT` for the ENSIP-19 default EVM chain.\n@see https://github.com/ensdomains/address-encoder/blob/master/docs/supported-cryptocurrencies.md for more details.",
  values: ENSIP19_CHAIN_VALUES,
});

///////////////////////
// PrimaryName inputs
///////////////////////
export const PrimaryNameByInput = builder.inputType("PrimaryNameByInput", {
  description:
    "Select a primary name lookup target. Exactly one of `coinType` or `chain` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinType: t.field({
      type: "CoinType",
      description: "The ENSIP-9 coin type to resolve the primary name for.",
    }),
    chain: t.field({
      type: ENSIP19Chain,
      description: "An ENSIP-19 supported chain to resolve the primary name for.",
    }),
  }),
});

export type PrimaryNameByInputValue = typeof PrimaryNameByInput.$inferInput;

export const PrimaryNamesWhereInput = builder.inputType("PrimaryNamesWhereInput", {
  description:
    "Filter primary name lookups. Exactly one of `coinTypes` or `chains` must be provided.",
  isOneOf: true,
  fields: (t) => ({
    coinTypes: t.field({
      type: ["CoinType"],
      description: "Coin types to resolve primary names for.",
      validate: { minLength: 1 },
    }),
    chains: t.field({
      type: [ENSIP19Chain],
      description: "ENSIP-19 supported chains to resolve primary names for.",
      validate: { minLength: 1 },
    }),
  }),
});

export type PrimaryNamesWhereInputValue = typeof PrimaryNamesWhereInput.$inferInput;

export {
  type PrimaryNameRecordModel,
  type PrimaryNameRecordParent,
  PrimaryNameRecordRef,
} from "@/omnigraph-api/schema/primary-name-record";
// Re-exports so that consumers of this module don't need to know about the file split.
export { DomainProfileRef } from "@/omnigraph-api/schema/profile";
export type { ResolvedRecordsModel } from "@/omnigraph-api/schema/records";
export { ResolvedRecordsRef } from "@/omnigraph-api/schema/records";
