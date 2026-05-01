import type { Fixture } from "../seeder/types";

export interface TestCase<Api> {
  id: string;
  description: string;
  fixtures: Fixture[];
  call: (api: Api) => Promise<unknown>;
  expected: unknown;
}
