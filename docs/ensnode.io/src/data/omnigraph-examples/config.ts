import type { DocsOmnigraphExampleNamespace } from "@lib/examples/omnigraph/constants";
import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

export type OmnigraphExampleConfig = {
  id: string;
  title: string;
  description: string;
  category: string;
  namespace: DocsOmnigraphExampleNamespace;
  hostSeparatePage: boolean;
};

/** Human-authored example copy, display order, and target namespace. Responses live in `responses.json` (refresh with `pnpm omnigraph-examples:refresh-responses`). */
export const OMNIGRAPH_EXAMPLES_CONFIG: OmnigraphExampleConfig[] = [
  {
    id: "domain-by-name",
    title: "Domain By Name",
    description: "Load a domain by interpreted name, including profile information.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-profile",
    title: "Domain Profile",
    description: "Load a domain's high-level profile (avatar, socials, addresses, and more).",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-records",
    title: "Domain Records",
    description: "For given name resolve raw records like `addresses`, `texts`, `contenthash` etc.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "find-domains",
    title: "Find Domains",
    description: "List domains matching a name prefix with ordering and registration metadata.",
    category: "Search",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-subdomains",
    title: "Domain Subdomains",
    description: "Paginate direct child names under a parent domain.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-events",
    title: "Domain Events",
    description: "Raw contract events associated with a domain's registry records.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domains-by-address",
    title: "Account Domains",
    description: "Load domains owned by an address via the Omnigraph `account` root field.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-primary-name",
    title: "Account Primary Name",
    description: "Load a primary name for an account on Ethereum, including profile information.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-events",
    title: "Account Events",
    description: "Events touching an account across indexed ENS contracts.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "registry-domains",
    title: "Registry Domains",
    description: "Enumerate domains under a specific v2 ETH registry contract.",
    category: "Registry",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-contract",
    title: "Permissions By Contract",
    description: "Roles and users granted on resources for a registrar or registry contract.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-user",
    title: "Permissions By User",
    description: "Resources and roles for an address in the permissions graph.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "account-resolver-permissions",
    title: "Account Resolver Permissions",
    description: "Resolver contracts where an account has been granted resolver ACLs.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "domain-resolver",
    title: "Domain Resolver",
    description: "Assigned resolver, stored records, resolver permissions, and events.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "namegraph",
    title: "Namegraph",
    description:
      "Walk a domain's registry, parent, subregistry, and direct subdomains (as in Core Concepts).",
    category: "Exploration",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-migrated-names",
    title: "Account Migration Counts",
    description: "Count an account's ENSv1 vs ENSv2 domains to gauge its migration progress.",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "eth-by-version",
    title: "ETH TLD By Version",
    description:
      "Load the .eth TLD across protocol versions: one Domain per version, discriminated by `__typename` (ENSv1Domain / ENSv2Domain).",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "accelerate-resolve",
    title: "Resolve domain records and tracking protocol acceleration",
    description:
      "Resolve domain records and track protocol acceleration with `trace` and `accelerate` arguments.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: false,
  },
];

export const OMNIGRAPH_EXAMPLES_INDEX_PATH = "/docs/integrate/omnigraph/examples" as const;

export function getOmnigraphExamplePageHref(
  config: Pick<OmnigraphExampleConfig, "id" | "hostSeparatePage">,
): string | undefined {
  if (!config.hostSeparatePage) return undefined;
  return `${OMNIGRAPH_EXAMPLES_INDEX_PATH}/${config.id}`;
}

const omnigraphExampleConfigById = new Map(
  OMNIGRAPH_EXAMPLES_CONFIG.map((config) => [config.id, config]),
);

export function getOmnigraphExampleConfigById(id: string): OmnigraphExampleConfig | undefined {
  return omnigraphExampleConfigById.get(id);
}

/** Starlight sidebar items under ENS Omnigraph API → Examples (order matches config). */
export const OMNIGRAPH_EXAMPLES_SIDEBAR_ITEMS: { label: string; link: string }[] = [
  { label: "Overview", link: OMNIGRAPH_EXAMPLES_INDEX_PATH },
  ...OMNIGRAPH_EXAMPLES_CONFIG.filter((config) => config.hostSeparatePage).map((config) => ({
    label: config.title,
    link: getOmnigraphExamplePageHref(config)!,
  })),
];
