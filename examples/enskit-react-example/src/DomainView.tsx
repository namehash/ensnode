import { EnsureInterpretedName } from "enskit/react";
import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import { getParentInterpretedName, type InterpretedName } from "enssdk";
import { Link, Navigate, useParams } from "react-router";

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

function RenderDomain({ name }: { name: InterpretedName }) {
  const [result] = useOmnigraphQuery({
    query: DomainByNameQuery,
    variables: { name },
  });

  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.domain) return <p>A Domain with name '{name}' was not found.</p>;

  const domain = readFragment(DomainFragment, data.domain);
  const parentName = getParentInterpretedName(name);

  return (
    <div>
      <h2>{domain.name ?? name}</h2>
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

export function DomainView() {
  const params = useParams();

  // if a user accesses '/domain' directly, redirect to '/domain/eth'
  // TODO: render the set of tlds
  if (params.name === undefined || params.name === "") return <Navigate to="/domain/eth" replace />;

  // here we ensure that the provided /domain/:name parameter is an InterpretedName
  return (
    <EnsureInterpretedName
      name={params.name}
      // this isn't an InterpretedName, but it can conform to InterpretedName: redirect the user
      interpreted={(name) => <Navigate to={`/domain/${name}`} replace />}
      // this name can't conform to InterpretedName: it is malformed or contains unnormalizable Labels
      malformed={(name) => (
        <div>
          <h2>{name} is malformed</h2>
          <Link to="/domain/eth">Back to 'eth' Domain.</Link>
        </div>
      )}
    >
      {(name) => <RenderDomain name={name} />}
    </EnsureInterpretedName>
  );
}
