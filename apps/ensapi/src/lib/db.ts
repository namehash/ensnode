import config from "@/config";

import * as schema from "@ensnode/ensdb-sdk";

import { makeDrizzle } from "@/lib/handlers/drizzle";
import { lazy } from "@/lib/lazy";

type Db = ReturnType<typeof makeDrizzle<typeof schema>>;

const _getDb = lazy<Db>(() =>
  makeDrizzle({
    databaseUrl: config.databaseUrl,
    databaseSchema: config.databaseSchemaName,
    schema,
  }),
);

export const db = new Proxy({} as Db, {
  get(_, prop) {
    const realDb = _getDb();
    const value = Reflect.get(realDb, prop as string, realDb);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(realDb);
    }
    return value;
  },
  has(_, prop) {
    return Reflect.has(_getDb(), prop);
  },
});
