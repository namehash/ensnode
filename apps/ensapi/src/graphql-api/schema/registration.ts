import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import { hexToBigInt } from "viem";

import * as schema from "@ensnode/ensnode-schema";
import {
  type ENSv1DomainId,
  isRegistrationFullyExpired,
  isRegistrationInGracePeriod,
  type RegistrationId,
  type RequiredAndNotNull,
} from "@ensnode/ensnode-sdk";

import { builder } from "@/graphql-api/builder";
import { orderPaginationBy, paginateByInt } from "@/graphql-api/lib/connection-helpers";
import { getModelId } from "@/graphql-api/lib/get-model-id";
import { lazyConnection } from "@/graphql-api/lib/lazy-connection";
import { AccountIdRef } from "@/graphql-api/schema/account-id";
import { INDEX_PAGINATED_CONNECTION_ARGS } from "@/graphql-api/schema/constants";
import { DomainInterfaceRef } from "@/graphql-api/schema/domain";
import { EventRef } from "@/graphql-api/schema/event";
import { RenewalRef } from "@/graphql-api/schema/renewal";
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
  description:
    "A Registration represents a Domain's registration status within the various registries.",
  fields: (t) => ({
    //////////////////////
    // Registration.id
    //////////////////////
    id: t.field({
      description: "A unique reference to this Registration.",
      type: "ID",
      nullable: false,
      resolve: (parent) => parent.id,
    }),

    ///////////////////////
    // Registration.domain
    ///////////////////////
    domain: t.field({
      description: "The Domain for which this Registration exists.",
      type: DomainInterfaceRef,
      nullable: false,
      resolve: (parent) => parent.domainId,
    }),

    //////////////////////////
    // Registration.registrar
    //////////////////////////
    registrar: t.field({
      description: "The Registrar contract under which this Registration is managed.",
      type: AccountIdRef,
      nullable: false,
      resolve: (parent) => ({ chainId: parent.registrarChainId, address: parent.registrarAddress }),
    }),

    ///////////////////////////
    // Registration.expiry
    ///////////////////////////
    expiry: t.field({
      description: "A UnixTimestamp indicating the Registration's expiry, if exists.",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.expiry,
    }),

    ////////////////////////
    // Registration.expired
    ////////////////////////
    expired: t.field({
      description:
        "Indicates whether this Registration is expired. If the Registration is for an ENSv1Domain, a Registration is only considered `expired` after the Grace Period has elapsed.",
      type: "Boolean",
      nullable: false,
      resolve: (parent, args, context) => isRegistrationFullyExpired(parent, context.now),
    }),

    /////////////////////////
    // Registration.referrer
    /////////////////////////
    referrer: t.field({
      description: "The extra `referrer` data provided with a Registration, if exists.",
      type: "Hex",
      nullable: true,
      resolve: (parent) => parent.referrer,
    }),

    /////////////////////////
    // Registration.renewals
    /////////////////////////
    renewals: t.connection({
      description:
        "Renewals that have occurred within this Registration's lifespan to extend its expiration.",
      type: RenewalRef,
      resolve: (parent, args) => {
        const scope = and(
          eq(schema.renewal.domainId, parent.domainId),
          eq(schema.renewal.registrationIndex, parent.index),
        );

        return lazyConnection({
          totalCount: () => db.$count(schema.renewal, scope),
          connection: () =>
            resolveCursorConnection(
              { ...INDEX_PAGINATED_CONNECTION_ARGS, args },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                db
                  .select()
                  .from(schema.renewal)
                  .where(and(scope, paginateByInt(schema.renewal.index, before, after)))
                  .orderBy(orderPaginationBy(schema.renewal.index, inverted))
                  .limit(limit),
            ),
        });
      },
    }),

    //////////////////////
    // Registration.event
    //////////////////////
    event: t.field({
      description: "The Event for which this Registration was created.",
      type: EventRef,
      nullable: false,
      resolve: (parent) => parent.eventId,
    }),
  }),
});

///////////////////////////
// NameWrapperRegistration
///////////////////////////
export const NameWrapperRegistrationRef =
  builder.objectRef<NameWrapperRegistration>("NameWrapperRegistration");
NameWrapperRegistrationRef.implement({
  description:
    "A NameWrapperRegistration represents a Registration initiated by the ENSv1 NameWrapper.",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "NameWrapper",
  fields: (t) => ({
    /////////////////////////////////
    // NameWrapperRegistration.fuses
    /////////////////////////////////
    fuses: t.field({
      description: "The Fuses for this Registration's Domain in the NameWrapper.",
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
  description:
    "A BaseRegistrarRegistration represents a Registration within an ENSv1 BaseRegistrar contract, including those deployed by Basenames and Lineanames.",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "BaseRegistrar",
  fields: (t) => ({
    //////////////////////////////////////
    // BaseRegistrarRegistration.baseCost
    //////////////////////////////////////
    baseCost: t.field({
      description: "The `baseCost` for registering this Domain, in wei.",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.baseCost,
    }),

    /////////////////////////////////////
    // BaseRegistrarRegistration.premium
    /////////////////////////////////////
    premium: t.field({
      description: "The `premium` for registering this Domain, in wei.",
      type: "BigInt",
      nullable: true,
      resolve: (parent) => parent.premium,
    }),

    /////////////////////////////////////
    // BaseRegistrarRegistration.wrapped
    /////////////////////////////////////
    wrapped: t.field({
      description:
        "Additional metadata if this BaseRegistrarRegistration is wrapped by the NameWrapper (i.e. in the case of wrapped .eth names).",
      type: WrappedBaseRegistrarRegistrationRef,
      nullable: true,
      resolve: (parent) => (parent.wrapped ? parent : null),
    }),

    ////////////////////////////////
    // Registration.isInGracePeriod
    ////////////////////////////////
    isInGracePeriod: t.field({
      description:
        "Whether this Registration is in the Grace Period (90 days) and can be renewed by the current owner.",
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
  description: "ThreeDNSRegistration represents a Registration within ThreeDNSToken.",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "ThreeDNS",
  fields: (t) => ({
    //
  }),
});

/////////////////////////////
// ENSv2RegistryRegistration
/////////////////////////////
export const ENSv2RegistryRegistrationRef = builder.objectRef<ENSv2RegistryRegistration>(
  "ENSv2RegistryRegistration",
);
ENSv2RegistryRegistrationRef.implement({
  description: "ENSv2RegistryRegistration represents a Registration within an ENSv2 Registry.",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "ENSv2Registry",
  fields: (t) => ({}),
});

////////////////////////////////////
// WrappedBaseRegistrarRegistration
////////////////////////////////////
export const WrappedBaseRegistrarRegistrationRef = builder.objectRef<BaseRegistrarRegistration>(
  "WrappedBaseRegistrarRegistration",
);

WrappedBaseRegistrarRegistrationRef.implement({
  description:
    "Additional metadata for BaseRegistrar Registrations wrapped by the NameWrapper (i.e. in the case of a wrapped .eth name)",
  fields: (t) => ({
    ///////////////////
    // Wrapped.tokenId
    ///////////////////
    tokenId: t.field({
      description: "The TokenID for this Domain in the NameWrapper.",
      type: "BigInt",
      nullable: false,
      // NOTE: only ENSv1 Domains can be wrapped, id is guaranteed to be ENSv1DomainId === Node
      resolve: (parent) => hexToBigInt(parent.domainId as ENSv1DomainId),
    }),

    /////////////////
    // Wrapped.fuses
    /////////////////
    fuses: t.field({
      description: "The Fuses for this Registration's Domain in the NameWrapper.",
      type: "Int",
      nullable: false,
      // TODO: decode/render Fuses enum
      resolve: (parent) => parent.fuses,
    }),
  }),
});
