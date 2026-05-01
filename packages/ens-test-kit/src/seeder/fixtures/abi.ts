import type { Hex } from "../../types";
import type { SeederContext } from "../types";
import {
  buildFixture,
  type FixtureArgs,
  type FixtureMeta,
  type ResolverRecordFields,
} from "./base";
import { assertExpectedResolver, getResolverAndNode, writeResolverTx } from "./resolver-utils";
import { getSenderClient } from "./sender-client";

type AbiRecordFields = ResolverRecordFields & {
  contentType: number;
  value: Hex;
};

export type AbiRecordFixture = FixtureMeta<"abiRecord"> & AbiRecordFields;

export function abiRecord(args: FixtureArgs<"abiRecord", AbiRecordFields>): AbiRecordFixture {
  return buildFixture("abiRecord", args);
}

export async function applyAbiRecordFixture(
  fixture: AbiRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const { node, resolver } = getResolverAndNode(fixture.name, fixture.resolverAddress);
  await assertExpectedResolver(senderClient, fixture.name, resolver);
  await writeResolverTx(senderClient, {
    resolver,
    functionName: "setABI",
    data: [node, BigInt(fixture.contentType), fixture.value],
    log: `abi ${fixture.name} contentType=${fixture.contentType}`,
  });
}
