/** Human-authored example copy. Example responses live in `responses.json` (refresh with `pnpm omnigraph-examples:refresh-responses`). */
export const OMNIGRAPH_EXAMPLES_META: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
  }
> = {
  "find-domains": {
    name: "Find Domains",
    description: "List domains matching a name prefix with ordering and registration metadata.",
    category: "Search",
  },
  "domain-by-name": {
    name: "Domain By Name",
    description:
      "Load a domain by interpreted name, including v1/v2 discriminated fields and subregistry on ENSv2.",
    category: "Resolution",
  },
  "domain-subdomains": {
    name: "Domain Subdomains",
    description: "Paginate direct child names under a parent domain.",
    category: "Resolution",
  },
  "domain-events": {
    name: "Domain Events",
    description: "Raw contract events associated with a domain’s registry records.",
    category: "History",
  },
  "domains-by-address": {
    name: "Account Domains",
    description: "Load domains owned by an address via the Omnigraph `account` root field.",
    category: "Accounts",
  },
  "account-events": {
    name: "Account Events",
    description: "Events touching an account across indexed ENS contracts.",
    category: "History",
  },
  "registry-domains": {
    name: "Registry Domains",
    description: "Enumerate domains under a specific v2 ETH registry contract.",
    category: "Registry",
  },
  "permissions-by-contract": {
    name: "Permissions By Contract",
    description: "Roles and users granted on resources for a registrar or registry contract.",
    category: "Permissions",
  },
  "permissions-by-user": {
    name: "Permissions By User",
    description: "Resources and roles for an address in the permissions graph.",
    category: "Permissions",
  },
  "account-resolver-permissions": {
    name: "Account Resolver Permissions",
    description: "Resolver contracts where an account has been granted resolver ACLs.",
    category: "Permissions",
  },
  "domain-resolver": {
    name: "Domain Resolver",
    description: "Assigned resolver, stored records, resolver permissions, and events.",
    category: "Resolution",
  },
  namegraph: {
    name: "Namegraph",
    description: "Walk the root tree: root → domains → nested subdomains (depth-limited).",
    category: "Exploration",
  },
};
