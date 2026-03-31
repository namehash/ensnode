import { type Address, type Hex, isHex, size } from "viem";
import { z } from "zod/v4";

import {
  type ChainId,
  type CoinType,
  type DomainId,
  type InterpretedName,
  isInterpretedName,
  type Name,
  type Node,
  type PermissionsId,
  type PermissionsResourceId,
  type PermissionsUserId,
  type RegistrationId,
  type RegistryId,
  type RenewalId,
  type ResolverId,
  type ResolverRecordsId,
} from "@ensnode/ensnode-sdk";
import {
  makeChainIdSchema,
  makeCoinTypeSchema,
  makeLowercaseAddressSchema,
} from "@ensnode/ensnode-sdk/internal";

import { builder } from "@/graphql-api/builder";

builder.scalarType("BigInt", {
  description: "BigInt represents non-fractional signed whole numeric values.",
  serialize: (value: bigint) => value.toString(),
  parseValue: (value) => z.coerce.bigint().parse(value),
});

builder.scalarType("Address", {
  description: "Address represents a lowercase (unchecksummed) viem#Address.",
  serialize: (value: Address) => value.toString(),
  parseValue: (value) => makeLowercaseAddressSchema("Address").parse(value),
});

builder.scalarType("Hex", {
  description: "Hex represents viem#Hex.",
  serialize: (value: Hex) => value.toString(),
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isHex(value)) {
          ctx.issues.push({
            code: "custom",
            message: "Must be a valid Hex",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as Hex)
      .parse(value),
});

builder.scalarType("ChainId", {
  description: "ChainId represents a @ensnode/ensnode-sdk#ChainId.",
  serialize: (value: ChainId) => value,
  parseValue: (value) => makeChainIdSchema("ChainId").parse(value),
});

builder.scalarType("CoinType", {
  description: "CoinType represents a @ensnode/ensnode-sdk#CoinType.",
  serialize: (value: CoinType) => value,
  parseValue: (value) => makeCoinTypeSchema("CoinType").parse(value),
});

builder.scalarType("Node", {
  description: "Node represents a @ensnode/ensnode-sdk#Node.",
  serialize: (value: Node) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (isHex(ctx.value) && size(ctx.value) === 32) return;

        ctx.issues.push({
          code: "custom",
          message: `Node must be a valid Node`,
          input: ctx.value,
        });
      })
      .transform((val) => val as Node)
      .parse(value),
});

builder.scalarType("Name", {
  description: "Name represents a @ensnode/ensnode-sdk#InterpretedName.",
  serialize: (value: Name) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isInterpretedName(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message: "Name must consist exclusively of Encoded LabelHashes or normalized labels.",
            input: ctx.value,
          });
        }
      })
      .transform((val) => val as InterpretedName)
      .parse(value),
});

builder.scalarType("DomainId", {
  description: "DomainId represents a @ensnode/ensnode-sdk#DomainId.",
  serialize: (value: DomainId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as DomainId)
      .parse(value),
});

builder.scalarType("RegistryId", {
  description: "RegistryId represents a @ensnode/ensnode-sdk#RegistryId.",
  serialize: (value: RegistryId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistryId)
      .parse(value),
});

builder.scalarType("ResolverId", {
  description: "ResolverId represents a @ensnode/ensnode-sdk#ResolverId.",
  serialize: (value: ResolverId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverId)
      .parse(value),
});

builder.scalarType("PermissionsId", {
  description: "PermissionsId represents a @ensnode/ensnode-sdk#PermissionsId.",
  serialize: (value: PermissionsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsId)
      .parse(value),
});

builder.scalarType("PermissionsResourceId", {
  description: "PermissionsResourceId represents a @ensnode/ensnode-sdk#PermissionsResourceId.",
  serialize: (value: PermissionsResourceId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsResourceId)
      .parse(value),
});

builder.scalarType("PermissionsUserId", {
  description: "PermissionsUserId represents a @ensnode/ensnode-sdk#PermissionsUserId.",
  serialize: (value: PermissionsUserId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsUserId)
      .parse(value),
});

builder.scalarType("RegistrationId", {
  description: "RegistrationId represents a @ensnode/ensnode-sdk#RegistrationId.",
  serialize: (value: RegistrationId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistrationId)
      .parse(value),
});

builder.scalarType("RenewalId", {
  description: "RenewalId represents a @ensnode/ensnode-sdk#RenewalId.",
  serialize: (value: RenewalId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RenewalId)
      .parse(value),
});

builder.scalarType("ResolverRecordsId", {
  description: "ResolverRecordsId represents a @ensnode/ensnode-sdk#ResolverRecordsId.",
  serialize: (value: ResolverRecordsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverRecordsId)
      .parse(value),
});
