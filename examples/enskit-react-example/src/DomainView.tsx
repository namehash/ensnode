import { EnsureInterpretedName } from "enskit/react";
import { type FragmentOf, graphql, readFragment, useOmnigraphQuery } from "enskit/react/omnigraph";
import {
  asLiteralName,
  beautifyInterpretedName,
  type DomainId,
  type InterpretedName,
} from "enssdk";
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

// A single query that identifies a Domain by either its DomainId or its Name. `Query.domain` accepts
// a `DomainIdInput` (a `@oneOf` of `{ id }` or `{ name }`), so both views below share this one query
// and simply pass whichever stable reference they have.
const DomainByQuery = graphql(
  `
  query DomainBy($by: DomainIdInput!, $first: Int!, $after: String) {
    domain(by: $by) {
      ...DomainFragment
      # # TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
      # parent { id canonical { name { interpreted } } }
      parent { id name }
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

// A stable reference to a Domain: either its DomainId or its Name.
//
// This is the "Stable IDs vs. Namegraph addressing" distinction from the Omnigraph docs:
// https://ensnode.io/docs/integrate/omnigraph#stable-ids-vs-namegraph-addressing
//
// Identifying by Name is *Namegraph addressing*: it resolves to whichever Domain the namespace
// currently considers Canonical for that name, so the target can change as canonicality changes (and
// a name like `vitalik.eth` may have both an ENSv1 and an ENSv2 Domain that disagree on which is
// canonical). Identifying by DomainId is a *stable reference*: it always addresses one exact Domain,
// preserving its ENSv1/ENSv2 variant. So whenever we already hold a DomainId (search results, owned
// domains, subdomains, a parent pointer), we link by `id` — that way clicking the v1 variant of a
// name lands the user on the v1 Domain instead of being silently redirected to its v2 canonical.
type DomainBy = { id: DomainId } | { name: InterpretedName };

const SUBDOMAINS_PAGE_SIZE = 20;

// sepolia-v2's ENSv1Resolver is misconfigured, so ENSv1-only names aren't currently resolvable.
function SepoliaNotice() {
  return (
    <div
      style={{ border: "1px solid #a94442", padding: "0.75rem", marginBottom: "1rem" }}
      role="note"
    >
      Heads up! sepolia-v2's ENSv1Resolver is misconfigured, and ENSv1-only names aren't resolvable,
      so they're not currently visible here! This will be fixed by the ENS Team in the near future.
      If you followed a link to a Domain and it isn't showing up here, it's likely an ENSv1-only
      name (unmigrated) and isn't currently resolvable.
    </div>
  );
}

function SubdomainLink({ data }: { data: FragmentOf<typeof DomainFragment> }) {
  const domain = readFragment(DomainFragment, data);

  return (
    <li>
      {domain.name ? (
        // link by DomainId so the exact Domain (and its ENSv1/ENSv2 variant) is preserved
        <Link to={`/domain/id/${domain.id}`}>{beautifyInterpretedName(domain.name)}</Link>
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

function RenderDomain({ by }: { by: DomainBy }) {
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: DomainByQuery,
    variables: { by, first: SUBDOMAINS_PAGE_SIZE, after },
  });

  const { data, fetching, error } = result;

  if (!data && fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.domain) {
    const reference = "id" in by ? `id '${by.id}'` : `name '${beautifyInterpretedName(by.name)}'`;
    return <p>No domain was found with {reference}.</p>;
  }

  const domain = readFragment(DomainFragment, data.domain);
  const { subdomains } = data.domain;

  return (
    <div>
      {/*
      TODO: after upgrading v2-sepolia to have materialized canonical name, update this to:
      <h2>{beautifyInterpretedName(domain.canonical?.name.interpreted ?? domain.id)}</h2>
      */}
      <h2>{domain.name ? beautifyInterpretedName(domain.name) : domain.id}</h2>
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
        <Link to={`/domain/id/${data.domain.parent.id}`}>
          ← {beautifyInterpretedName(data.domain.parent.canonical.name.interpreted)}
        </Link>
      )}
       */}
      {data.domain.parent?.name && (
        <Link to={`/domain/id/${data.domain.parent.id}`}>
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

// Identify a Domain by its Name (`/domain/name/:name`). Resolves to the name's Canonical Domain.
export function DomainByNameView() {
  const params = useParams();

  // if a user accesses '/domain/name' directly, redirect to '/domain/name/eth'
  // TODO: render the set of tlds
  if (params.name === undefined || params.name === "")
    return <Navigate to="/domain/name/eth" replace />;

  // here we ensure that the provided /domain/name/:name parameter is an InterpretedName
  return (
    <>
      <SepoliaNotice />
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

          // if a user ever navigates to a /domain/name/:name that contains unnormalizable labels, we want
          // to represent that label as an encoded labelhash and redirect the user to that canonical page
          coerceUnnormalizableLabelsToEncodedLabelHashes: true,
        }}
        //
        // this isn't an InterpretedName, but it was coerced to an InterpretedName: redirect the user to the canonical url
        coerced={(name) => <Navigate to={`/domain/name/${name}`} replace />}
        //
        // this name can't conform to InterpretedName nor can it be coerced: it is malformed: show an error
        malformed={(name) => (
          <div>
            <h2>Invalid name: '{name}'</h2>
            <Link to="/domain/name/eth">Back to 'eth' Domain.</Link>
          </div>
        )}
      >
        {(name) => <RenderDomain key={name} by={{ name }} />}
      </EnsureInterpretedName>
    </>
  );
}

// Identify a Domain by its DomainId (`/domain/id/:id`). Addresses the exact Domain, preserving its
// ENSv1/ENSv2 variant. This is the preferred link target when a stable DomainId is already in hand.
export function DomainByIdView() {
  const params = useParams();

  if (params.id === undefined || params.id === "")
    return <Navigate to="/domain/name/eth" replace />;

  // a DomainId is an opaque, stable identifier; it requires no normalization
  const id = params.id as DomainId;

  return (
    <>
      <SepoliaNotice />
      <RenderDomain key={id} by={{ id }} />
    </>
  );
}
