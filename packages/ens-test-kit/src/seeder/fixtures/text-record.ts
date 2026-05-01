import type { SeederContext } from "../types";
import {
  buildFixture,
  type FixtureArgs,
  type FixtureMeta,
  type ResolverRecordFields,
} from "./base";
import { assertExpectedResolver, getResolverAndNode, writeResolverTx } from "./resolver-utils";
import { getSenderClient } from "./sender-client";

type TextRecordFields = ResolverRecordFields & {
  key: string;
  value: string;
};

export type TextRecordFixture = FixtureMeta<"textRecord"> & TextRecordFields;

export function textRecord(args: FixtureArgs<"textRecord", TextRecordFields>): TextRecordFixture {
  return buildFixture("textRecord", args);
}

export async function applyTextRecordFixture(
  fixture: TextRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const { node, resolver } = getResolverAndNode(fixture.name, fixture.resolverAddress);
  await assertExpectedResolver(senderClient, fixture.name, resolver);
  await writeResolverTx(senderClient, {
    resolver,
    functionName: "setText",
    data: [node, fixture.key, fixture.value],
    log: `text-record ${fixture.name} key=${fixture.key}`,
  });
}
