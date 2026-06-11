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
    id: "hello-world",
    title: "Hello World",
    description:
      "This query loads, from a wallet address, the Ethereum primary name and interpreted profile, plus ENSv1 and ENSv2 ownership counts.",
    category: "Introduction",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: false,
  },
  {
    id: "domain-profile",
    title: "Domain Profile",
    description:
      "This query loads a domain's high-level profile (<code>avatar</code>, <code>socials</code>, <code>addresses</code>, and more).",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-records",
    title: "Domain Records",
    description:
      "This query resolves raw records for a given name, such as <code>addresses</code>, <code>texts</code>, and <code>contenthash</code>.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-profile-and-records",
    title: "Profile And Records",
    description:
      "This query resolves interpreted profile and raw records in one query to compare shapes side by side.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: false,
  },
  {
    id: "domain-by-name",
    title: "Domain By Name",
    description: "This query loads a domain by interpreted name, including profile information.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "offchain-name",
    title: "Offchain Name",
    description:
      "Resolve an offchain (CCIP-Read) name. Resolvable-but-unindexed names surface as an <code>UnindexedDomain</code> instead of returning <code>null</code>.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "find-domains",
    title: "Find Domains",
    description:
      "This query lists domains matching a name prefix with ordering and registration metadata.",
    category: "Search",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-subdomains",
    title: "Domain Subdomains",
    description: "This query paginates direct child names under a parent domain.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-subdomains-recently-registered",
    title: "Recently Registered Subdomains",
    description:
      "This query lists a parent domain's subdomains ordered by most recent registration first.",
    category: "Resolution",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "domain-events",
    title: "Domain Events",
    description:
      "This query loads raw contract events associated with a domain's registry records.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domains-by-address",
    title: "Account Domains",
    description:
      "This query loads domains owned by an address via the Omnigraph <code>account</code> root field.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-primary-names",
    title: "Account Primary Names",
    description: "This query loads the primary names for an account on Ethereum and Base.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: false,
  },
  {
    id: "account-primary-name-records",
    title: "Account Primary Name Records",
    description:
      "This query loads the primary name for an account on Ethereum and forward-resolves its profile in the same request.",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-events",
    title: "Account Events",
    description: "This query loads events touching an account across indexed ENS contracts.",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "registry-domains",
    title: "Registry Domains",
    description: "This query enumerates domains under a specific v2 ETH registry contract.",
    category: "Registry",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-contract",
    title: "Permissions By Contract",
    description:
      "This query loads roles and users granted on resources for a registrar or registry contract.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-user",
    title: "Permissions By User",
    description: "This query loads resources and roles for an address in the permissions graph.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "account-resolver-permissions",
    title: "Account Resolver Permissions",
    description:
      "This query loads resolver contracts where an account has been granted resolver ACLs.",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "domain-resolver",
    title: "Domain Resolver",
    description:
      "This query loads the assigned resolver contract address and recent resolver events.",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "namegraph",
    title: "Namegraph",
    description:
      "This query walks a domain's registry, parent, subregistry, and direct subdomains (as in Core Concepts).",
    category: "Exploration",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-migrated-names",
    title: "Account Migration Counts",
    description:
      "This query counts an account's ENSv1 vs ENSv2 domains to gauge its migration progress.",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "eth-by-version",
    title: "ETH TLD By Version",
    description:
      "This query loads the .eth TLD across protocol versions: one Domain per version, discriminated by <code>__typename</code> (<code>ENSv1Domain</code> / <code>ENSv2Domain</code>).",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "accelerate-resolve",
    title: "Resolve primary name and records, and track protocol acceleration",
    description:
      "This query resolves primary name and records, and tracks protocol acceleration with <code>trace</code> and <code>accelerate</code> arguments.",
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
