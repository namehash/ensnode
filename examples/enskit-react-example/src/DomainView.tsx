import { EnsureInterpretedName } from "enskit/react";
import {
  type FragmentOf,
  graphql,
  readFragment,
  useOmnigraphQuery,
  type VariablesOf,
} from "enskit/react/omnigraph";
import { asLiteralName, beautifyInterpretedName, type DomainId } from "enssdk";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";

import {
  accountPath,
  domainIdPath,
  domainNamePath,
  parentDomainPath,
  useAppPath,
} from "./app-paths";
import { useEnsnodeInstance } from "./EnsnodeInstanceProvider";

const DomainFragment = graphql(`
  fragment DomainFragment on Domain {
    __typename
    id
    canonical { name { beautified } }
    owner { id address }
  }
`);

// a single query that identifies a Domain by either DomainId or its Name
const DomainQuery = graphql(
  `
  query DomainBy($by: DomainIdInput!, $first: Int!, $after: String) {
    domain(by: $by) {
      ...DomainFragment
      parent { id canonical { name { beautified interpreted } } }
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

type DomainBy = VariablesOf<typeof DomainQuery>["by"];

const SUBDOMAINS_PAGE_SIZE = 20;

function SubdomainLink({ data }: { data: FragmentOf<typeof DomainFragment> }) {
  const appPath = useAppPath();
  const domain = readFragment(DomainFragment, data);
  const ownerAddress = domain.owner?.address;

  return (
    <li>
      {/* link by DomainId so the exact Domain (and its ENSv1/ENSv2 variant) is preserved */}
      <Link to={appPath(domainIdPath(domain.id))}>
        {domain.canonical?.name.beautified ?? <em>non-canonical domain</em>}
      </Link>{" "}
      ({domain.__typename})
      <span>
        {" "}
        — Owner{" "}
        {ownerAddress ? (
          <Link to={appPath(accountPath(ownerAddress))}>{ownerAddress}</Link>
        ) : (
          <code>{domain.__typename === "ENSv2Domain" ? "Reserved" : "0x0"}</code>
        )}
      </span>
    </li>
  );
}

function RenderDomain({ by }: { by: DomainBy }) {
  const appPath = useAppPath();
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: DomainQuery,
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
      <h2>{domain.canonical?.name.beautified ?? domain.id}</h2>
      <p>
        Owner:{" "}
        {domain.owner ? (
          <Link to={appPath(accountPath(domain.owner.address))}>{domain.owner.address}</Link>
        ) : domain.__typename === "ENSv2Domain" ? (
          "Reserved"
        ) : (
          "0x0"
        )}
      </p>
      <p>Version: {domain.__typename}</p>

      {data.domain.parent && (
        // always link the parent by its (stable) DomainId; fall back to the id as the label when the
        // parent has no Canonical Name
        <Link to={appPath(parentDomainPath(data.domain.parent))}>
          ←{" "}
          {data.domain.parent.canonical
            ? data.domain.parent.canonical.name.beautified
            : `non-canonical parent domain with id '${data.domain.parent.id}'`}
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

function CoercedNameRedirect({ name }: { name: string }) {
  const appPath = useAppPath();
  return <Navigate to={appPath(domainNamePath(name))} replace />;
}

// Identify a Domain by its Name (`/domain/name/:name`).
// Resolves to the name's Canonical Domain.
export function DomainByNameView() {
  const appPath = useAppPath();
  const { constants } = useEnsnodeInstance();
  // the `/domain/name/:name` route guarantees `:name` is present
  const { name } = useParams() as { name: string };

  // here we ensure that the provided /domain/name/:name parameter is an InterpretedName
  return (
    <EnsureInterpretedName
      name={asLiteralName(name)}
      //
      // options for how we interpret user input
      options={{
        // we're explicit in this example app and tell enskit that, for our purposes, we don't want
        // our downstream `children` component to receive the ENS Root Name ("") as a `name` value
        allowENSRootName: false,

        // allow the incoming LiteralName to contain Encoded LabelHash segments (e.g. [abcd...xyz])
        allowEncodedLabelHashes: true,

        // if a user ever navigates to a /domain/name/:name that contains unnormalizable labels, we want
        // to represent that label as an encoded labelhash and redirect the user to that canonical page
        coerceUnnormalizableLabelsToEncodedLabelHashes: true,
      }}
      //
      // this isn't an InterpretedName, but it was coerced to an InterpretedName: redirect the user to the canonical url
      coerced={(name) => <CoercedNameRedirect name={name} />}
      //
      // this name can't conform to InterpretedName nor can it be coerced: it is malformed: show an error
      malformed={(name) => (
        <div>
          <h2>Invalid name: '{name}'</h2>
          <Link to={appPath(domainNamePath(constants.defaultDomainName))}>
            Back to '{constants.defaultDomainName}' Domain.
          </Link>
        </div>
      )}
    >
      {(name) => <RenderDomain key={name} by={{ name }} />}
    </EnsureInterpretedName>
  );
}

// Renders a Domain by its DomainId (`/domain/id/:id`).
// This is the preferred link target when a stable DomainId is already in hand.
export function DomainByIdView() {
  // the `/domain/id/:id` route guarantees `:id` is present; a DomainId is an opaque, stable
  // identifier, so it requires no normalization
  const { id } = useParams() as { id: DomainId };

  return <RenderDomain key={id} by={{ id }} />;
}
