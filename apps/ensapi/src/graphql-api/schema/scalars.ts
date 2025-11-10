import { type Address, isHex, size } from "viem";
import { z } from "zod/v4";

import {
  type ChainId,
  type InterpretedName,
  isInterpretedName,
  type Name,
  type Node,
} from "@ensnode/ensnode-sdk";
import { makeChainIdSchema, makeLowercaseAddressSchema } from "@ensnode/ensnode-sdk/internal";

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

builder.scalarType("ChainId", {
  description: "ChainId represents a @ensnode/ensnode-sdk#ChainId.",
  serialize: (value: ChainId) => value,
  parseValue: (value) => makeChainIdSchema("ChainId").parse(value),
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
