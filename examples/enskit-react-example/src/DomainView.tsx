import { EnsureInterpretedName } from "enskit/react";
import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import { asLiteralName, beautifyInterpretedName, type InterpretedName } from "enssdk";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    id
    # # TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
    # canonical { name { interpreted } }
    name
    owner { id address }
  }
`);

const DomainByNameQuery = graphql(
  `
  query DomainByName($name: InterpretedName!, $first: Int!, $after: String) {
    domain(by: { name: $name }) {
      ...DomainFragment
      # # TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
      # parent { canonical { name { interpreted } } }
      parent { name }
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
      {domain.name ? (
        <Link to={`/domain/${domain.name}`}>{beautifyInterpretedName(domain.name)}</Link>
        // TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
        // {domain.canonical ? (
        //   <Link to={`/domain/${domain.canonical.name.interpreted}`}>
        //     {beautifyInterpretedName(domain.canonical.name.interpreted)}
        //   </Link>
      ) : (
        <em>non-canonical domain</em>
      )}{" "}
      ({domain.__typename})
      <span>
        {" "}
        — Owner{" "}
        <code>
          {domain.owner?.address ?? (domain.__typename === "ENSv2Domain" ? "Reserved" : "0x0")}
        </code>
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
  if (!data?.domain) return <p>No domain was found with name '{beautifyInterpretedName(name)}'.</p>;

  const domain = readFragment(DomainFragment, data.domain);
  const { subdomains } = data.domain;

  return (
    <div>
      {/* 
      TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
      <h2>{beautifyInterpretedName(domain.canonical?.name.interpreted ?? name)}</h2>
      */}
      <h2>{beautifyInterpretedName(domain.name ?? name)}</h2>
      <p>
        Owner:{" "}
        {domain.owner ? (
          <Link to={`/account/${domain.owner.address}`}>{domain.owner.address}</Link>
        ) : domain.__typename === "ENSv2Domain" ? (
          "Reserved"
        ) : (
          "0x0"
        )}
      </p>
      <p>Version: {domain.__typename}</p>

      {/* 
      TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
      {data.domain.parent?.canonical && (
        <Link to={`/domain/${data.domain.parent.canonical.name.interpreted}`}>
          ← {beautifyInterpretedName(data.domain.parent.canonical.name.interpreted)}
        </Link>
      )} 
       */}
      {data.domain.parent?.name && (
        <Link to={`/domain/${data.domain.parent.name}`}>
          ← {beautifyInterpretedName(data.domain.parent.name)}
        </Link>
      )}

      <h3>Subdomains</h3>
      {subdomains && subdomains.edges.length === 0 ? (
        <p>No Subdomains</p>
      ) : (
        <>
          <p>
            Showcases trivial cursor-based pagination over a{" "}
            <a href="https://relay.dev/graphql/connections.htm">Relay Connection</a> (here, a
            Domain's <code>subdomains</code>). Use the button below to fetch the next page.
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
    <>
      <div
        style={{ border: "1px solid #a94442", padding: "0.75rem", marginBottom: "1rem" }}
        role="note"
      >
        Heads up! sepolia-v2's ENSv1Resolver is misconfigured, and ENSv1-only names aren't
        resolvable, so they're not currently visible here! This will be fixed by the ENS Team in the
        near future. If you followed a link to a Domain and it isn't showing up here, it's likely an
        ENSv1-only name (unmigrated) and isn't currently resolvable.
      </div>
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
    </>
  );
}
