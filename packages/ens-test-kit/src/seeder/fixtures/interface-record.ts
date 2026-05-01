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

type InterfaceRecordFields = ResolverRecordFields & {
  interfaceId: Hex;
  value: Hex;
};

export type InterfaceRecordFixture = FixtureMeta<"interfaceRecord"> & InterfaceRecordFields;

export function interfaceRecord(
  args: FixtureArgs<"interfaceRecord", InterfaceRecordFields>,
): InterfaceRecordFixture {
  return buildFixture("interfaceRecord", args);
}

export async function applyInterfaceRecordFixture(
  fixture: InterfaceRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const { node, resolver } = getResolverAndNode(fixture.name, fixture.resolverAddress);
  await assertExpectedResolver(senderClient, fixture.name, resolver);
  await writeResolverTx(senderClient, {
    resolver,
    functionName: "setInterface",
    data: [node, fixture.interfaceId, fixture.value],
    log: `interface-record ${fixture.name} interfaceId=${fixture.interfaceId}`,
  });
}
