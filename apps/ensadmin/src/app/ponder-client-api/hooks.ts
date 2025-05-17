import { desc } from "@ponder/client";
import type { createClient } from "@ponder/client";
import { usePonderQuery } from "@ponder/react";
import { useMemo, useState } from "react";

import * as schema from "@ensnode/ensnode-schema";

type PonderClient = ReturnType<typeof createClient>;

interface QueryCodeSnippet {
  code: string;
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFn(db: PonderClient["db"]): any;
}

export function useCodeSnippets() {
  const [selectedSnippetIndex, selectSnippet] = useState(0);

  const snippets = useMemo(
    () =>
      [
        {
          code: `usePonderQuery({
  queryFn: (db) => db.select().from(ponderSchema.account).limit(10),
});
      `,
          name: "Accounts",
          description: "Fetch 10 records",
          queryFn: (db: PonderClient["db"]) => db.select().from(schema.account).limit(10),
        },

        {
          code: `usePonderQuery({
  queryFn: db
    .select()
    .from(schema.domain)
    .orderBy(
      // import { desc } from '@ponder/client';
      desc(schema.domain.createdAt)
    )
    .limit(20),
});
      `,
          name: "Domains",
          description: "Fetch 20 most recently created records",
          queryFn: (db: PonderClient["db"]) =>
            db.select().from(schema.domain).orderBy(desc(schema.domain.createdAt)).limit(20),
        },
      ] as Array<QueryCodeSnippet>,
    [],
  );

  const queryFn = useMemo(
    () => snippets[selectedSnippetIndex].queryFn,
    [snippets, selectedSnippetIndex],
  );

  const ponderQuery = usePonderQuery({
    queryFn,
  });

  return {
    ponderQuery,
    selectedSnippetIndex,
    allSnippets: snippets,
    selectSnippet,
    selectedSnippet: snippets[selectedSnippetIndex],
  };
}
