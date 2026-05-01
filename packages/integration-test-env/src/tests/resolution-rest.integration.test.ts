import { forwardResolutionCases, reverseResolutionCases } from "@ensnode/ens-test-kit/cases";
import { runSuite } from "@ensnode/ens-test-kit/vitest";

import { RestAdapter } from "../adapters/rest-adapter";

const restAdapter = new RestAdapter(process.env.ENSNODE_URL ?? "http://localhost:4334");

runSuite(restAdapter, [...forwardResolutionCases, ...reverseResolutionCases]);
