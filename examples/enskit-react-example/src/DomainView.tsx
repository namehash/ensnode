import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import { asInterpretedName } from "enssdk";
import { Link, useParams } from "react-router";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    id
    name
    owner { id address }
  }
`);

const DomainByNameQuery = graphql(
  `
  query DomainByName($name: InterpretedName!) {
    domain(by: { name: $name }) {
      ...DomainFragment
      subdomains(first: 20) {
        edges {
          node {
            ...DomainFragment
          }
        }
      }
    }
  }
`,
  [DomainFragment],
);

function SubdomainLink({ data }: { data: FragmentOf<typeof DomainFragment> }) {
  const domain = readFragment(DomainFragment, data);

  return (
    <li>
      <Link to={`/domain/${domain.name}`}>{domain.name}</Link>
      <span> — {domain.owner?.address ?? "no owner"}</span>
    </li>
  );
}

export function DomainView() {
  const params = useParams();
  const name = asInterpretedName(params.name ?? "eth");

  const [result] = useOmnigraphQuery({
    query: DomainByNameQuery,
    variables: { name },
  });

  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.domain) return <p>Not found</p>;

  const domain = readFragment(DomainFragment, data.domain);
  const parentName = name.includes(".") ? name.slice(name.indexOf(".") + 1) : null;

  return (
    <div>
      <h2>{domain.name}</h2>
      <p>Owner: {domain.owner?.address ?? "none"}</p>

      {parentName && (
        <p>
          ← <Link to={`/domain/${parentName}`}>{parentName}</Link>
        </p>
      )}

      <h3>Subdomains</h3>
      <ul>
        {data.domain.subdomains?.edges.map((edge) => {
          const { id } = readFragment(DomainFragment, edge.node);
          return <SubdomainLink key={id} data={edge.node} />;
        })}
      </ul>
    </div>
  );
}
