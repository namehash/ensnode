import { parseArgs } from "node:util";

import { getFixtureSet, seedFixtures } from "../seeder";

type ParsedArgs = {
  rpcUrl: string;
  fixtureSet: string;
};

function parseSeedArgs(argv: string[]): ParsedArgs {
  const [subcommand, ...rest] = argv;
  if (subcommand !== "seed") {
    throw new Error(`Unknown command "${subcommand ?? ""}". Expected: seed.`);
  }

  const { values } = parseArgs({
    args: rest,
    options: {
      rpc: {
        type: "string",
      },
      fixtures: {
        type: "string",
        default: "canonical",
      },
    },
    strict: true,
    allowPositionals: false,
  });

  if (!values.rpc) {
    throw new Error("Missing required argument: --rpc <url>.");
  }

  return {
    rpcUrl: values.rpc,
    fixtureSet: values.fixtures,
  };
}

export async function runSeedCli(argv: string[]): Promise<void> {
  const { rpcUrl, fixtureSet } = parseSeedArgs(argv);
  const fixtures = getFixtureSet(fixtureSet);
  const applied = await seedFixtures(rpcUrl, fixtures);

  const names = [
    ...new Set(
      applied.map((fixture) => ("name" in fixture ? fixture.name : undefined)).filter(Boolean),
    ),
  ];
  console.log(`[seed] Applied ${applied.length} fixture(s) from set "${fixtureSet}".`);
  if (names.length > 0) {
    console.log(`[seed] Names: ${names.join(", ")}`);
  }
}
