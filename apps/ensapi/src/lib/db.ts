import config from "@/config";

import * as schema from "@ensnode/ensdb-sdk";

import { makeDrizzle } from "@/lib/handlers/drizzle";
import { lazyProxy } from "@/lib/lazy";

type Db = ReturnType<typeof makeDrizzle<typeof schema>>;

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
export const db = lazyProxy<Db>(() =>
  makeDrizzle({
    databaseUrl: config.databaseUrl,
    databaseSchema: config.databaseSchemaName,
    schema,
  }),
);
