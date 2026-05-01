import {
  type Account,
  type Chain,
  createWalletClient,
  http,
  type PublicActions,
  publicActions,
  type Transport,
  type WalletClient,
} from "viem";

import { ensTestEnvChain } from "@ensnode/datasources";
import { accounts } from "@ensnode/datasources/devnet";

import { applyAbiRecordFixture } from "./fixtures/abi";
import { canonicalFixtures } from "./fixtures/common";
import { applyContenthashRecordFixture } from "./fixtures/contenthash";
import { applyInterfaceRecordFixture } from "./fixtures/interface-record";
import { applyMulticoinAddressRecordFixture } from "./fixtures/multicoin-address";
import { applyPubkeyRecordFixture } from "./fixtures/pubkey";
import { applyReverseNameFixture } from "./fixtures/reverse-name";
import { applyTextRecordFixture } from "./fixtures/text-record";
import type { Fixture, SeederContext } from "./types";

function createDevnetWalletClient(transport: Transport, account: Account) {
  return createWalletClient({
    chain: ensTestEnvChain,
    transport,
    account,
  }).extend(publicActions);
}

type DevnetWalletClient = WalletClient<Transport, Chain, Account> & PublicActions;

function createDevnetWalletClients(rpcUrl: string): SeederContext["clients"] {
  const transport = http(rpcUrl);
  const makeClient = (account: Account): DevnetWalletClient =>
    createDevnetWalletClient(transport, account);

  return {
    deployer: makeClient(accounts.deployer),
    owner: makeClient(accounts.owner),
    user: makeClient(accounts.user),
    user2: makeClient(accounts.user2),
  };
}

export function createSeederContext(rpcUrl: string): SeederContext {
  return {
    rpcUrl,
    clients: createDevnetWalletClients(rpcUrl),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries
      .map(([key, innerValue]) => `${JSON.stringify(key)}:${stableStringify(innerValue)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function dedupeFixtures(fixtures: Fixture[]): Fixture[] {
  const byId = new Map<string, Fixture>();

  for (const fixture of fixtures) {
    const existing = byId.get(fixture.id);
    if (!existing) {
      byId.set(fixture.id, fixture);
      continue;
    }

    const incomingComparable = stableStringify(fixture);
    const existingComparable = stableStringify(existing);

    if (incomingComparable !== existingComparable) {
      throw new Error(
        [
          `Conflicting fixtures with id "${fixture.id}".`,
          `existing=${JSON.stringify(existing)}`,
          `incoming=${JSON.stringify(fixture)}`,
        ].join(" "),
      );
    }
  }

  return [...byId.values()];
}

const HANDLERS: {
  [K in Fixture["kind"]]: (
    fixture: Extract<Fixture, { kind: K }>,
    ctx: SeederContext,
  ) => Promise<void>;
} = {
  reverseName: applyReverseNameFixture,
  textRecord: applyTextRecordFixture,
  multicoinAddressRecord: applyMulticoinAddressRecordFixture,
  contenthashRecord: applyContenthashRecordFixture,
  pubkeyRecord: applyPubkeyRecordFixture,
  abiRecord: applyAbiRecordFixture,
  interfaceRecord: applyInterfaceRecordFixture,
};

export async function seedFixtures(rpcUrl: string, fixtures: Fixture[]): Promise<Fixture[]> {
  const context = createSeederContext(rpcUrl);
  const deduped = dedupeFixtures(fixtures);

  for (const fixture of deduped) {
    const handler = HANDLERS[fixture.kind] as (
      fixture: Fixture,
      ctx: SeederContext,
    ) => Promise<void>;
    await handler(fixture, context);
  }

  return deduped;
}

export function getFixtureSet(name: string): Fixture[] {
  if (name === "canonical") return canonicalFixtures;
  throw new Error(`Unknown fixture set "${name}". Supported sets: canonical.`);
}
