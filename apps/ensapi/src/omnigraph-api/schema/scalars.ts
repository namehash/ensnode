import {
  asInterpretedLabel,
  asInterpretedName,
  type ChainId,
  type CoinType,
  type DomainId,
  type Hex,
  isInterpretedLabel,
  isInterpretedName,
  type Name,
  type Node,
  type NormalizedAddress,
  type PermissionsId,
  type PermissionsResourceId,
  type PermissionsUserId,
  type RegistrationId,
  type RegistryId,
  type RenewalId,
  type ResolverId,
  type ResolverRecordsId,
} from "enssdk";
import { isHex, size } from "viem";
import { z } from "zod/v4";

import {
  makeChainIdSchema,
  makeCoinTypeSchema,
  makeNormalizedAddressSchema,
} from "@ensnode/ensnode-sdk/internal";

import { builder } from "@/omnigraph-api/builder";

builder.scalarType("BigInt", {
  description: "BigInt represents non-fractional signed whole numeric values.",
  serialize: (value: bigint) => value.toString(),
  parseValue: (value) => z.coerce.bigint().parse(value),
});

builder.scalarType("Address", {
  description: "Address represents an EVM Address in all lowercase.",
  serialize: (value: NormalizedAddress) => value,
  parseValue: (value) => makeNormalizedAddressSchema("Address").parse(value),
});

builder.scalarType("Hex", {
  description: "Hex represents viem#Hex.",
  serialize: (value: Hex) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isHex(ctx.value)) {
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
  description: "ChainId represents a enssdk#ChainId.",
  serialize: (value: ChainId) => value,
  parseValue: (value) => makeChainIdSchema("ChainId").parse(value),
});

builder.scalarType("CoinType", {
  description: "CoinType represents a enssdk#CoinType.",
  serialize: (value: CoinType) => value,
  parseValue: (value) => makeCoinTypeSchema("CoinType").parse(value),
});

builder.scalarType("Node", {
  description: "Node represents a enssdk#Node.",
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

builder.scalarType("InterpretedName", {
  description: "InterpretedName represents a enssdk#InterpretedName.",
  serialize: (value: Name) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isInterpretedName(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message:
              "InterpretedName must consist exclusively of Encoded LabelHashes or normalized labels.",
            input: ctx.value,
          });
        }
      })
      .transform((val) => asInterpretedName(val))
      .parse(value),
});

builder.scalarType("InterpretedLabel", {
  description: "InterpretedLabel represents a enssdk#InterpretedLabel.",
  serialize: (value: Name) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .check((ctx) => {
        if (!isInterpretedLabel(ctx.value)) {
          ctx.issues.push({
            code: "custom",
            message: "InterpretedLabel must be an Encoded LabelHash or normalized.",
            input: ctx.value,
          });
        }
      })
      .transform((val) => asInterpretedLabel(val))
      .parse(value),
});

builder.scalarType("DomainId", {
  description: "DomainId represents a enssdk#DomainId.",
  serialize: (value: DomainId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as DomainId)
      .parse(value),
});

builder.scalarType("RegistryId", {
  description: "RegistryId represents a enssdk#RegistryId.",
  serialize: (value: RegistryId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistryId)
      .parse(value),
});

builder.scalarType("ResolverId", {
  description: "ResolverId represents a enssdk#ResolverId.",
  serialize: (value: ResolverId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverId)
      .parse(value),
});

builder.scalarType("PermissionsId", {
  description: "PermissionsId represents a enssdk#PermissionsId.",
  serialize: (value: PermissionsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsId)
      .parse(value),
});

builder.scalarType("PermissionsResourceId", {
  description: "PermissionsResourceId represents a enssdk#PermissionsResourceId.",
  serialize: (value: PermissionsResourceId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsResourceId)
      .parse(value),
});

builder.scalarType("PermissionsUserId", {
  description: "PermissionsUserId represents a enssdk#PermissionsUserId.",
  serialize: (value: PermissionsUserId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as PermissionsUserId)
      .parse(value),
});

builder.scalarType("RegistrationId", {
  description: "RegistrationId represents a enssdk#RegistrationId.",
  serialize: (value: RegistrationId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RegistrationId)
      .parse(value),
});

builder.scalarType("RenewalId", {
  description: "RenewalId represents a enssdk#RenewalId.",
  serialize: (value: RenewalId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as RenewalId)
      .parse(value),
});

builder.scalarType("ResolverRecordsId", {
  description: "ResolverRecordsId represents a enssdk#ResolverRecordsId.",
  serialize: (value: ResolverRecordsId) => value,
  parseValue: (value) =>
    z.coerce
      .string()
      .transform((val) => val as ResolverRecordsId)
      .parse(value),
});
