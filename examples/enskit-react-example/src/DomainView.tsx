import { EnsureInterpretedName } from "enskit/react";
import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import { asLiteralName, getParentInterpretedName, type InterpretedName } from "enssdk";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    id
    name
    owner { id address }
  }
`);

const DomainByNameQuery = graphql(
  `
  query DomainByName($name: InterpretedName!, $first: Int!, $after: String) {
    domain(by: { name: $name }) {
      ...DomainFragment
      subdomains(first: $first, after: $after) {
        edges {
          node {
            ...DomainFragment
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`,
  [DomainFragment],
);

const SUBDOMAINS_PAGE_SIZE = 20;

function SubdomainLink({ data }: { data: FragmentOf<typeof DomainFragment> }) {
  const domain = readFragment(DomainFragment, data);

  return (
    <li>
      <Link to={`/domain/${domain.name}`}>{domain.name}</Link> ({domain.__typename})
      <span>
        {" "}
        — Owner <code>{domain.owner?.address ?? "none"}</code>
      </span>
    </li>
  );
}

function RenderDomain({ name }: { name: InterpretedName }) {
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: DomainByNameQuery,
    variables: { name, first: SUBDOMAINS_PAGE_SIZE, after },
  });

  const { data, fetching, error } = result;

  if (!data && fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.domain) return <p>No domain was found with name '{name}'.</p>;

  const domain = readFragment(DomainFragment, data.domain);
  const parentName = getParentInterpretedName(name);
  const { subdomains } = data.domain;

  return (
    <div>
      <h2>{domain.name ?? name}</h2>
      <p>Owner: {domain.owner?.address ?? "none"}</p>
      <p>Version: {domain.__typename}</p>

      {parentName && (
        <p>
          ← <Link to={`/domain/${parentName}`}>{parentName}</Link>
        </p>
      )}

      <h3>Subdomains</h3>
      {subdomains && subdomains.edges.length === 0 ? (
        <p>No Subdomains</p>
      ) : (
        <>
          <p>
            Showcases trivial cursor-based pagination over a connection (here, a Domain's{" "}
            <code>subdomains</code>). Use the button below to fetch the next page.
          </p>
          <ul>
            {subdomains?.edges.map((edge) => {
              const { id } = readFragment(DomainFragment, edge.node);
              return <SubdomainLink key={id} data={edge.node} />;
            })}
          </ul>

          {subdomains?.pageInfo.hasNextPage && (
            <button
              type="button"
              disabled={fetching}
              onClick={() => setAfter(subdomains.pageInfo.endCursor)}
            >
              {fetching ? "Loading..." : "Next page"}
            </button>
          )}
        </>
      )}
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
        // downstream `children` component to receive the ENS Root Name ("") as a `name` value
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
      {(name) => <RenderDomain key={name} name={name} />}
    </EnsureInterpretedName>
  );
}
