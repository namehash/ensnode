import type { DocsOmnigraphExampleNamespace } from "@lib/examples/omnigraph/constants";
import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

/** Human-authored example copy and target namespace. Responses live in `responses.json` (refresh with `pnpm omnigraph-examples:refresh-responses`). */
export const OMNIGRAPH_EXAMPLES_CONFIG: Record<
  string,
  {
    name: string;
    description: string;
    category: string;
    namespace: DocsOmnigraphExampleNamespace;
  }
> = {
  "find-domains": {
    name: "Find Domains",
    description: "List domains matching a name prefix with ordering and registration metadata.",
    category: "Search",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domain-by-name": {
    name: "Domain By Name",
    description: "Load a domain by interpreted name, including profile information.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domain-profile": {
    name: "Domain Profile",
    description: "Load a domain's high-level profile (avatar, socials, addresses, and more).",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domain-records": {
    name: "Domain Records",
    description: "For given name resolve raw records like `addresses`, `texts`, `contenthash` etc.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domain-subdomains": {
    name: "Domain Subdomains",
    description: "Paginate direct child names under a parent domain.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domain-events": {
    name: "Domain Events",
    description: "Raw contract events associated with a domain’s registry records.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "domains-by-address": {
    name: "Account Domains",
    description: "Load domains owned by an address via the Omnigraph `account` root field.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "account-events": {
    name: "Account Events",
    description: "Events touching an account across indexed ENS contracts.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "account-primary-name": {
    name: "Account Primary Name",
    description: "Load a primary name for an account on Ethereum, including profile information.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "registry-domains": {
    name: "Registry Domains",
    description: "Enumerate domains under a specific v2 ETH registry contract.",
    category: "Registry",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
  "permissions-by-contract": {
    name: "Permissions By Contract",
    description: "Roles and users granted on resources for a registrar or registry contract.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
  "permissions-by-user": {
    name: "Permissions By User",
    description: "Resources and roles for an address in the permissions graph.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
  "account-resolver-permissions": {
    name: "Account Resolver Permissions",
    description: "Resolver contracts where an account has been granted resolver ACLs.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
  "domain-resolver": {
    name: "Domain Resolver",
    description: "Assigned resolver, stored records, resolver permissions, and events.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
  },
  namegraph: {
    name: "Namegraph",
    description:
      "Walk a domain's registry, parent, subregistry, and direct subdomains (as in Core Concepts).",
    category: "Exploration",
    namespace: ENSNamespaceIds.Mainnet,
  },
  "account-migrated-names": {
    name: "Account Migration Counts",
    description: "Count an account's ENSv1 vs ENSv2 domains to gauge its migration progress.",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
  "eth-by-version": {
    name: "ETH TLD By Version",
    description:
      "Load the .eth TLD across protocol versions: one Domain per version, discriminated by `__typename` (ENSv1Domain / ENSv2Domain).",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
  },
};
