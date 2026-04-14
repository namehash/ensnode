import { EnsureInterpretedName } from "enskit/react";
import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import { asLiteralName, getParentInterpretedName, type InterpretedName } from "enssdk";
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
  if (!data?.domain) return <p>No domain was found with name '{name}'.</p>;

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
      name={asLiteralName(params.name)}
      //
      // options for how we interpret user input
      options={{
        // while not strictly necessary to specify, since we catch the empty string case above, we'll
        // be explicit in this example app and tell enskit that for our purposes, we don't want our
        // downstream
        allowENSRootName: false,

        // allow the incoming LiteralName to contain Encoded LabelHash segments (e.g. [abcd...xyz])
        allowEncodedLabelHashes: true,

        // if a user ever navigates to a /domain/:name that contains unnormalizable labels, we want
        // to represent that label as an encoded labelhash and redirect the user to that canonical page
        coerceUnnormalizableLabelsToEncodedLabelHashes: true,
      }}
      //
      // this isn't an InterpretedName, but it was coerced to an InterpretedName: redirect the user to the canonical url
      coerced={(name) => <Navigate to={`/domain/${name}`} replace />}
      //
      // this name can't conform to InterpretedName nor can it be coerced: it is malformed: show an error
      malformed={(name) => (
        <div>
          <h2>Invalid name: '{name}'</h2>
          <Link to="/domain/eth">Back to 'eth' Domain.</Link>
        </div>
      )}
    >
      {(name) => <RenderDomain name={name} />}
    </EnsureInterpretedName>
  );
}
