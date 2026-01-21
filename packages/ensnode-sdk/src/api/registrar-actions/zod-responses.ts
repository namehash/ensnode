import z from "zod/v4";

import { buildAbstractResultOkSchema } from "../../shared/result/zod-schemas";
import { makeResponsePageContextSchema } from "../shared/pagination/zod-schemas";
import type { RegistrarActionsResultOkData } from "./result";
import { makeNamedRegistrarActionSchema } from "./zod-schemas";

export const registrarActionsResultOkSchema =
  buildAbstractResultOkSchema<RegistrarActionsResultOkData>(
    z.object({
      registrarActions: z.array(makeNamedRegistrarActionSchema("registrarActions", true)),
      pageContext: makeResponsePageContextSchema("pageContext"),
    }),
  );
