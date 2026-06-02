import { defineCommand } from "citty";
import { asInterpretedName, namehashInterpretedName } from "enssdk";

import { outputArgs } from "../lib/args";
import { printResult, runSafely } from "../lib/output";
import { assertCleanIdentifier } from "../lib/validate";

export const namehash = defineCommand({
  meta: {
    name: "namehash",
    description: "Compute the Node of a Name",
  },
  args: {
    name: {
      type: "positional",
      required: true,
      description: "The Name to namehash (e.g. vitalik.eth)",
    },
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(() => {
      assertCleanIdentifier(args.name, "name");
      const name = asInterpretedName(args.name);
      const node = namehashInterpretedName(name);
      printResult({ name, node }, args, (data: { node: string }) => data.node);
    }),
});
