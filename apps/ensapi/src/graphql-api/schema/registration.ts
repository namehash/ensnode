import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";

import {
  isRegistrationFullyExpired,
  isRegistrationInGracePeriod,
  type RegistrationId,
  type RenewalId,
  type RequiredAndNotNull,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { DEFAULT_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { DomainInterfaceRef } from "@/graphql-api/schema/domain";
import { RenewalRef } from "@/graphql-api/schema/renewal";
import { WrappedBaseRegistrarRegistrationRef } from "@/graphql-api/schema/wrapped-baseregistrar-registration";
import { db } from "@/lib/db";
import { cursors } from "@/graphql-api/schema/cursors";

export const RegistrationInterfaceRef = builder.loadableInterfaceRef("Registration", {
  load: (ids: RegistrationId[]) =>
    db.query.registration.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    }),
  toKey: getModelId,
  cacheResolved: true,
  sort: true,
});

export type Registration = Exclude<typeof RegistrationInterfaceRef.$inferType, RegistrationId>;
export type RegistrationInterface = Pick<
  Registration,
  | "id"
  | "type"
  | "index"
  | "domainId"
  | "start"
  | "expiry"
  | "registrarChainId"
  | "registrarAddress"
  | "registrantId"
  | "referrer"
>;
export type NameWrapperRegistration = RequiredAndNotNull<Registration, "fuses">;
export type BaseRegistrarRegistration = RequiredAndNotNull<
  Registration,
  "gracePeriod" | "wrapped" | "fuses"
> & {
  baseCost: bigint | null;
  premium: bigint | null;
};
export type ThreeDNSRegistration = Registration;
export type ENSv2RegistryRegistration = Registration;

RegistrationInterfaceRef.implement({
  description: "TODO",
  fields: (t) => ({
    //////////////////////
    // Registration.id
    //////////////////////
    id: t.expose("id", {
      description: "TODO",
      type: "ID",
      nullable: false,
    }),

    ///////////////////////
    // Registration.domain
    ///////////////////////
    domain: t.field({
      description: "TODO",
      type: DomainInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.domainId,
    }),

    //////////////////////////
    // Registration.registrar
    //////////////////////////
    registrar: t.field({
      description: "TODO",
      type: AccountIdRef,
      nullable: false,
      resolve: (parent) => ({ chainId: parent.registrarChainId, address: parent.registrarAddress }),
    }),

    //////////////////////
    // Registration.start
    //////////////////////
    start: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.start,
    }),

    ///////////////////////////
    // Registration.expiry
    ///////////////////////////
    expiry: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.expiry,
    }),

    ////////////////////////
    // Registration.expired
    ////////////////////////
    expired: t.field({
      description: "TODO",
      type: "Boolean",
      nullable: false,
      resolve: (parent, args, context) => isRegistrationFullyExpired(parent, context.now),
    }),

    /////////////////////////
    // Registration.referrer
    /////////////////////////
    referrer: t.field({
      description: "TODO",
      type: "Hex",
      nullable: true,
      resolve: (parent) => parent.referrer,
    }),

    /////////////////////////
    // Registration.renewals
    /////////////////////////
    renewals: t.connection({
      description: "TODO",
      type: RenewalRef,
      resolve: (parent, args, context) =>
        resolveCursorConnection(
          { ...DEFAULT_CONNECTION_ARGS, args },
          ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
            db.query.renewal.findMany({
              where: (t, { lt, gt, and }) =>
                and(
                  ...[
                    before !== undefined && lt(t.id, cursors.decode<RenewalId>(before)),
                    after !== undefined && gt(t.id, cursors.decode<RenewalId>(after)),
                  ].filter((c) => !!c),
                ),
              orderBy: (t, { asc, desc }) => (inverted ? desc(t.id) : asc(t.id)),
              limit,
            }),
        ),
    }),
  }),
});

///////////////////////////
// NameWrapperRegistration
///////////////////////////
export const NameWrapperRegistrationRef =
  builder.objectRef<NameWrapperRegistration>("NameWrapperRegistration");
NameWrapperRegistrationRef.implement({
  description: "TODO",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "NameWrapper",
  fields: (t) => ({
    /////////////////////////////////
    // NameWrapperRegistration.fuses
    /////////////////////////////////
    fuses: t.field({
      description: "TODO",
      type: "Int",
      nullable: false,
      // TODO: decode/render Fuses enum
      resolve: (parent) => parent.fuses,
    }),
  }),
});

/////////////////////////////
// BaseRegistrarRegistration
/////////////////////////////
export const BaseRegistrarRegistrationRef = builder.objectRef<BaseRegistrarRegistration>(
  "BaseRegistrarRegistration",
);
BaseRegistrarRegistrationRef.implement({
  description: "TODO",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "BaseRegistrar",
  fields: (t) => ({
    //////////////////////////////////////
    // BaseRegistrarRegistration.baseCost
    //////////////////////////////////////
    baseCost: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.baseCost,
    }),

    /////////////////////////////////////
    // BaseRegistrarRegistration.premium
    /////////////////////////////////////
    premium: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.premium,
    }),

    /////////////////////////////////////
    // BaseRegistrarRegistration.wrapped
    /////////////////////////////////////
    wrapped: t.field({
      description: "TODO",
      type: WrappedBaseRegistrarRegistrationRef,
      nullable: true,
      resolve: (parent) => (parent.wrapped ? parent : null),
    }),

    ////////////////////////////////
    // Registration.isInGracePeriod
    ////////////////////////////////
    isInGracePeriod: t.field({
      description: "TODO",
      type: "Boolean",
      nullable: false,
      resolve: (parent, args, context) => isRegistrationInGracePeriod(parent, context.now),
    }),
  }),
});

////////////////////////
// ThreeDNSRegistration
////////////////////////
export const ThreeDNSRegistrationRef =
  builder.objectRef<ThreeDNSRegistration>("ThreeDNSRegistration");
ThreeDNSRegistrationRef.implement({
  description: "TODO",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "ThreeDNS",
  fields: (t) => ({
    //
  }),
});

///////////////////////////
// ENSv2RegistryRegistration
///////////////////////////
export const ENSv2RegistryRegistrationRef = builder.objectRef<ENSv2RegistryRegistration>(
  "ENSv2RegistryRegistration",
);
ENSv2RegistryRegistrationRef.implement({
  description: "TODO",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "ENSv2Registry",
  fields: (t) => ({}),
});
