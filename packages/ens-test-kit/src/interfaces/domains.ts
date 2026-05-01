import type { Connection, Domain, DomainsWhere, Hex, NormalizedName, Registration } from "../types";

export interface DomainsApi {
  getDomainByName(name: NormalizedName): Promise<Domain | null>;
  getDomainByNamehash(node: Hex): Promise<Domain | null>;
  listDomains(where: DomainsWhere): Promise<Connection<Domain>>;
  getRegistration(name: NormalizedName): Promise<Registration | null>;
}
