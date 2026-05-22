import { asInterpretedName } from "enssdk";
import { createEnsNodeClient } from "enssdk/core";
import { type FragmentOf, graphql, omnigraph, readFragment } from "enssdk/omnigraph";

// you may use a NameHash Hosted ENSNode instance
// learn more at https://ensnode.io/docs/hosted-instances
// biome-ignore lint/style/noNonNullAssertion: invariant
const ENSNODE_URL = process.env.ENSNODE_URL!;

// create and extend an EnsNodeClient with Omnigraph support
const client = createEnsNodeClient({ url: ENSNODE_URL }).extend(omnigraph);

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    # a Domain's Canonical Name; null when the Domain is not in the canonical nametree
    canonical { name { beautified } }
    owner { address }
  }
`);

const HelloWorldQuery = graphql(
  `
  query HelloWorld($name: InterpretedName!) {
    domain(by: { name: $name }) {
      ...DomainFragment
      subdomains(first: 20) {
        totalCount
        edges { node { ...DomainFragment } }
      }
    }
  }
`,
  [DomainFragment],
);

function formatDomain(data: FragmentOf<typeof DomainFragment>): string {
  // type-safe access to fragment data!
  const domain = readFragment(DomainFragment, data);
  const name = domain.canonical ? domain.canonical.name.beautified : "<unnamed>";
  const owner = domain.owner?.address ?? "0x0 (means reserved for ENSv2)";
  return `${name} (${domain.__typename}) — Owner ${owner}`;
}

async function main() {
  console.log(`Querying ENSNode at ${ENSNODE_URL}...`);
  const name = asInterpretedName("eth");

  const result = await client.omnigraph.query({
    query: HelloWorldQuery,
    variables: { name },
  });

  if (result.errors) throw new Error(JSON.stringify(result.errors));
  if (!result.data?.domain) throw new Error(`Domain '${name}' not found`);

  const { domain } = result.data;
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
