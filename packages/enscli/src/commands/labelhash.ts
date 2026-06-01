import { defineCommand } from "citty";
import { asInterpretedLabel, labelhashInterpretedLabel } from "enssdk";

import { outputArgs } from "../lib/args";
import { printResult, runSafely } from "../lib/output";
import { assertCleanIdentifier } from "../lib/validate";

export const labelhash = defineCommand({
  meta: {
    name: "labelhash",
    description: "Compute the ENS labelhash of a single label",
  },
  args: {
    label: {
      type: "positional",
      required: true,
      description: "The label to hash (e.g. vitalik)",
    },
    ...outputArgs,
  },
  run: ({ args }) =>
    runSafely(() => {
      assertCleanIdentifier(args.label, "label");
      const label = asInterpretedLabel(args.label);
      const labelHash = labelhashInterpretedLabel(label);
      printResult({ label, labelHash }, args, (data: { labelHash: string }) => data.labelHash);
    }),
});
