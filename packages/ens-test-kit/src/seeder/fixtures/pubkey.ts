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

type PubkeyRecordFields = ResolverRecordFields & {
  x: Hex;
  y: Hex;
};

export type PubkeyRecordFixture = FixtureMeta<"pubkeyRecord"> & PubkeyRecordFields;

export function pubkeyRecord(
  args: FixtureArgs<"pubkeyRecord", PubkeyRecordFields>,
): PubkeyRecordFixture {
  return buildFixture("pubkeyRecord", args);
}

export async function applyPubkeyRecordFixture(
  fixture: PubkeyRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const { node, resolver } = getResolverAndNode(fixture.name, fixture.resolverAddress);
  await assertExpectedResolver(senderClient, fixture.name, resolver);
  await writeResolverTx(senderClient, {
    resolver,
    functionName: "setPubkey",
    data: [node, fixture.x, fixture.y],
    log: `pubkey ${fixture.name}`,
  });
}
