import type { AbiFixture } from "./fixtures/abi";
import type { ContenthashFixture } from "./fixtures/contenthash";
import type { InterfaceImplementerFixture } from "./fixtures/interface-implementer";
import type { MulticoinAddressFixture } from "./fixtures/multicoin-address";
import type { PrimaryNameFixture } from "./fixtures/primary-name";
import type { PubkeyFixture } from "./fixtures/pubkey";
import type { TextRecordFixture } from "./fixtures/text-record";

export type Fixture =
  | PrimaryNameFixture
  | TextRecordFixture
  | MulticoinAddressFixture
  | ContenthashFixture
  | PubkeyFixture
  | AbiFixture
  | InterfaceImplementerFixture;

export type FixtureKind = Fixture["kind"];
export type FixtureBase = Pick<Fixture, "id" | "kind">;

export interface SeederContext {
  rpcUrl: string;
  clients: {
    deployer: unknown;
    owner: unknown;
    user: unknown;
    user2: unknown;
  };
}
