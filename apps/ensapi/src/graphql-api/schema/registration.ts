import type { RegistrationId, RequiredAndNotNull } from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { getModelId } from "@/graphql-api/lib/get-id";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { DomainInterfaceRef } from "@/graphql-api/schema/domain";
import { WrappedBaseRegistrarRegistrationRef } from "@/graphql-api/schema/wrapped-baseregistrar-registration";
import { db } from "@/lib/db";

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
  | "expiration"
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
    // Registration.expiration
    ///////////////////////////
    expiration: t.field({
      description: "TODO",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.expiration,
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
