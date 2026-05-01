import type { Account, Chain, PublicActions, Transport, WalletClient } from "viem";

import type { AbiRecordFixture } from "./fixtures/abi";
import type { ContenthashRecordFixture } from "./fixtures/contenthash";
import type { InterfaceRecordFixture } from "./fixtures/interface-record";
import type { MulticoinAddressRecordFixture } from "./fixtures/multicoin-address";
import type { PubkeyRecordFixture } from "./fixtures/pubkey";
import type { ReverseNameFixture } from "./fixtures/reverse-name";
import type { TextRecordFixture } from "./fixtures/text-record";

export type Fixture =
  | ReverseNameFixture
  | TextRecordFixture
  | MulticoinAddressRecordFixture
  | ContenthashRecordFixture
  | PubkeyRecordFixture
  | AbiRecordFixture
  | InterfaceRecordFixture;

export type FixtureKind = Fixture["kind"];
export type FixtureBase = Pick<Fixture, "id" | "kind" | "sender">;

export type DevnetWalletClient = WalletClient<Transport, Chain, Account> & PublicActions;

export type SeederClients = {
  deployer: DevnetWalletClient;
  owner: DevnetWalletClient;
  user: DevnetWalletClient;
  user2: DevnetWalletClient;
};

export type SeederSender = keyof SeederClients;

export interface SeederContext {
  rpcUrl: string;
  clients: SeederClients;
}
