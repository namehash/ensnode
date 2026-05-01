import type { ChainId, Hex } from "../../types";
import type { SeederContext } from "../types";
import {
  buildFixture,
  type FixtureArgs,
  type FixtureMeta,
  type ResolverRecordFields,
} from "./base";
import { assertExpectedResolver, getResolverAndNode, writeResolverTx } from "./resolver-utils";
import { getSenderClient } from "./sender-client";

type MulticoinAddressRecordFields = ResolverRecordFields & {
  coinType: ChainId;
  value: Hex;
};

export type MulticoinAddressRecordFixture = FixtureMeta<"multicoinAddressRecord"> &
  MulticoinAddressRecordFields;

export function multicoinAddressRecord(
  args: FixtureArgs<"multicoinAddressRecord", MulticoinAddressRecordFields>,
): MulticoinAddressRecordFixture {
  return buildFixture("multicoinAddressRecord", args);
}

export async function applyMulticoinAddressRecordFixture(
  fixture: MulticoinAddressRecordFixture,
  ctx: SeederContext,
): Promise<void> {
  const senderClient = getSenderClient(ctx, fixture.sender);
  const { node, resolver } = getResolverAndNode(fixture.name, fixture.resolverAddress);
  await assertExpectedResolver(senderClient, fixture.name, resolver);
  await writeResolverTx(senderClient, {
    resolver,
    functionName: "setAddr",
    data: [node, BigInt(fixture.coinType), fixture.value],
    log: `multicoin-address ${fixture.name} coinType=${fixture.coinType}`,
  });
}
