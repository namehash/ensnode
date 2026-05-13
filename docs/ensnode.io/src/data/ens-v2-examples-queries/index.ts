import { accountDomainsExample } from "./account-domains";
import type { OmnigraphExampleQuery } from "./common";
import { domainByNameExample } from "./domain-by-name";

export const omnigraphExampleQueries: OmnigraphExampleQuery[] = [
  domainByNameExample,
  accountDomainsExample,
];

const byId = new Map(omnigraphExampleQueries.map((e) => [e.id, e]));

export function getOmnigraphExampleById(id: string): OmnigraphExampleQuery {
  const found = byId.get(id);
  if (!found) {
    throw new Error(`Unknown Omnigraph example id: ${id}`);
  }
  return found;
}
