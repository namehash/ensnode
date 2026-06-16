import type { DocsOmnigraphExampleNamespace } from "@lib/examples/omnigraph/constants";
import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";
import { getGraphqlApiExampleQueryById } from "@ensnode/ensnode-sdk/internal";

export type OmnigraphExampleConfig = {
  id: string;
  category: string;
  namespace: DocsOmnigraphExampleNamespace;
  hostSeparatePage: boolean;
};

/** Human-authored example copy, display order, and target namespace. Responses live in `responses.json` (refresh with `pnpm omnigraph-examples:refresh-responses`). */
export const OMNIGRAPH_EXAMPLES_CONFIG: OmnigraphExampleConfig[] = [
  {
    id: "hello-world",
    category: "Introduction",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: false,
  },
  {
    id: "domain-profile",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-records",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-by-name",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "find-domains",
    category: "Search",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-subdomains",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domain-subdomains-recently-registered",
    category: "Resolution",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "domain-events",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "domains-by-address",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-primary-name",
    category: "Accounts",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-events",
    category: "History",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "registry-domains",
    category: "Registry",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-contract",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "permissions-by-user",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "account-resolver-permissions",
    category: "Permissions",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "domain-resolver",
    category: "Resolution",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "namegraph",
    category: "Exploration",
    namespace: ENSNamespaceIds.Mainnet,
    hostSeparatePage: true,
  },
  {
    id: "account-migrated-names",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "eth-by-version",
    category: "Migration",
    namespace: ENSNamespaceIds.SepoliaV2,
    hostSeparatePage: true,
  },
  {
    id: "accelerate-resolve",
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
    label: getGraphqlApiExampleQueryById(config.id).title,
    link: getOmnigraphExamplePageHref(config)!,
  })),
];
