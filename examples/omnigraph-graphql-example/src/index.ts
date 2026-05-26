// you may use a NameHash Hosted ENSNode instance
// learn more at https://ensnode.io/docs/hosted-instances
const ENSNODE_URL = process.env.ENSNODE_URL ?? "https://api.v2-sepolia.ensnode.io";

// The Omnigraph is a standard GraphQL API following the Relay spec.
// You can use any GraphQL client — here we just use `fetch`.
const HELLO_WORLD_QUERY = /* GraphQL */ `
  query HelloWorld($name: InterpretedName!) {
    domain(by: { name: $name }) {
      __typename
      name
      owner { address }
      subdomains(first: 20) {
        totalCount
        edges { node { __typename name owner { address } } }
      }
    }
  }
`;

interface Domain {
  __typename: "ENSv1Domain" | "ENSv2Domain";
  name: string | null;
  owner: { address: string } | null;
}

interface QueryResult {
  data?: {
    domain:
      | (Domain & {
          subdomains: {
            totalCount: number;
            edges: { node: Domain }[];
          } | null;
        })
      | null;
  } | null;
  errors?: { message: string }[];
}

function formatDomain(domain: Domain): string {
  const name = domain.name ?? "<unnamed>";
  const owner = domain.owner?.address ?? "0x0 (means reserved for ENSv2)";
  return `${name} (${domain.__typename}) — Owner ${owner}`;
}

async function main() {
  console.log(`Querying ENSNode at ${ENSNODE_URL}...`);
  const response = await fetch(new URL("/api/omnigraph", ENSNODE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: HELLO_WORLD_QUERY,
      variables: { name: "eth" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const { data, errors } = (await response.json()) as QueryResult;

  if (errors) throw new Error(JSON.stringify(errors));
  if (!data?.domain) throw new Error("Domain 'eth' not found");

  const { domain } = data;
  const totalCount = domain.subdomains?.totalCount ?? 0;

  console.log(formatDomain(domain));
  console.log(`\nSubdomains (showing 20 of ${totalCount}):`);
  for (const { node } of domain.subdomains?.edges ?? []) {
    console.log(`  - ${formatDomain(node)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
