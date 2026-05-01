import type { TestCase } from "../cases/types";

export type RunSuite = <Api>(adapter: Api, cases: TestCase<Api>[]) => void;
