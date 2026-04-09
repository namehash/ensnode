import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, eq } from "drizzle-orm";
import type { ENSv1DomainId, RegistrationId } from "enssdk";
import { hexToBigInt } from "viem";

import {
  isRegistrationFullyExpired,
  isRegistrationInGracePeriod,
  type RequiredAndNotNull,
} from "@ensnode/ensnode-sdk";

import { ensDb, ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";
import { orderPaginationBy, paginateByInt } from "@/omnigraph-api/lib/connection-helpers";
import { cursors } from "@/omnigraph-api/lib/cursors";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import { AccountRef } from "@/omnigraph-api/schema/account";
import { AccountIdRef } from "@/omnigraph-api/schema/account-id";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import { DomainInterfaceRef } from "@/omnigraph-api/schema/domain";
import { EventRef } from "@/omnigraph-api/schema/event";
import { RenewalRef } from "@/omnigraph-api/schema/renewal";

export const RegistrationInterfaceRef = builder.loadableInterfaceRef("Registration", {
  load: (ids: RegistrationId[]) =>
    ensDb.query.registration.findMany({
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
  | "registrationIndex"
  | "domainId"
  | "expiry"
  | "registrarChainId"
  | "registrarAddress"
  | "registrantId"
  | "unregistrantId"
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
export type ENSv2RegistryReservation = Registration;

RegistrationInterfaceRef.implement({
  description:
    "A Registration represents a Domain's registration status within the various registries.",
  fields: (t) => ({
    //////////////////////
    // Registration.id
    //////////////////////
    id: t.field({
      description: "A unique reference to this Registration.",
      type: "RegistrationId",
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

    //////////////////////
    // Registration.start
    //////////////////////
    start: t.field({
      description: "A UnixTimestamp indicating when this Registration was created.",
      type: "BigInt",
      nullable: false,
      resolve: (parent) => parent.start,
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

    ///////////////////////////
    // Registration.registrant
    ///////////////////////////
    registrant: t.field({
      description: "The Registrant of a Registration, if exists.",
      type: AccountRef,
      nullable: true,
      resolve: (parent) => parent.registrantId,
    }),

    /////////////////////////////
    // Registration.unregistrant
    /////////////////////////////
    unregistrant: t.field({
      description: "The Unregistrant of a Registration, if exists.",
      type: AccountRef,
      nullable: true,
      resolve: (parent) => parent.unregistrantId,
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
          eq(ensIndexerSchema.renewal.domainId, parent.domainId),
          eq(ensIndexerSchema.renewal.registrationIndex, parent.registrationIndex),
        );

        return lazyConnection({
          totalCount: () => ensDb.$count(ensIndexerSchema.renewal, scope),
          connection: () =>
            resolveCursorConnection(
              {
                toCursor: (model) => cursors.encode(String(model.renewalIndex)),
                defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
                maxSize: PAGINATION_DEFAULT_MAX_SIZE,
                args,
              },
              ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) =>
                ensDb
                  .select()
                  .from(ensIndexerSchema.renewal)
                  .where(
                    and(scope, paginateByInt(ensIndexerSchema.renewal.renewalIndex, before, after)),
                  )
                  .orderBy(orderPaginationBy(ensIndexerSchema.renewal.renewalIndex, inverted))
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
  isTypeOf: (value) => (value as RegistrationInterface).type === "ENSv2RegistryRegistration",
  fields: (t) => ({}),
});

////////////////////////////
// ENSv2RegistryReservation
////////////////////////////
export const ENSv2RegistryReservationRef = builder.objectRef<ENSv2RegistryReservation>(
  "ENSv2RegistryReservation",
);
ENSv2RegistryReservationRef.implement({
  description: "ENSv2RegistryReservation represents a Reservation within an ENSv2 Registry.",
  interfaces: [RegistrationInterfaceRef],
  isTypeOf: (value) => (value as RegistrationInterface).type === "ENSv2RegistryReservation",
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
