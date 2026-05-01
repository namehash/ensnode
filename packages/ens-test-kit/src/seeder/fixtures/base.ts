import type { Hex, NormalizedName } from "../../types";
import type { SeederSender } from "../types";

export type FixtureMeta<K extends string> = {
  kind: K;
  id: string;
  sender?: SeederSender;
};

export type FixtureArgs<K extends string, Fields extends object> = Omit<
  FixtureMeta<K> & Fields,
  "kind"
>;

export function buildFixture<K extends string, Fields extends object>(
  kind: K,
  args: FixtureArgs<K, Fields>,
): FixtureMeta<K> & Fields {
  return {
    kind,
    ...args,
  } as FixtureMeta<K> & Fields;
}

export type ResolverRecordFields = {
  name: NormalizedName;
  resolverAddress?: Hex;
};
