import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";
import { isNormalizedAddress, type NormalizedAddress, toNormalizedAddress } from "enssdk";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router";

const AccountDomainsQuery = graphql(`
  query AccountDomains($address: Address!, $first: Int!, $after: String) {
    account(by: { address: $address }) {
      address
      domains(first: $first, after: $after) {
        totalCount
        edges {
          node { __typename id name owner { address } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`);

const PAGE_SIZE = 20;

function RenderAccount({ address }: { address: NormalizedAddress }) {
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: AccountDomainsQuery,
    variables: { address, first: PAGE_SIZE, after },
  });

  const { data, fetching, error } = result;

  if (!data && fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.account) return <p>No account found for '{address}'.</p>;

  const { domains } = data.account;
  if (!domains) return <p>No domains.</p>;

  return (
    <div>
      <h2>Account</h2>
      <p>
        Address: <code>{data.account.address}</code>
      </p>

      <h3>Owned Domains ({domains.totalCount})</h3>
      {domains.edges.length === 0 ? (
        <p>This account doesn't own any domains.</p>
      ) : (
        <>
          <p>
            Showcases cursor-based pagination over <code>Account.domains</code>.
          </p>
          <ul>
            {domains.edges.map((edge) => (
              <li key={edge.node.id}>
                <Link to={`/domain/${edge.node.name}`}>{edge.node.name}</Link> (
                {edge.node.__typename})
              </li>
            ))}
          </ul>

          {domains.pageInfo.hasNextPage && (
            <button
              type="button"
              disabled={fetching}
              onClick={() => setAfter(domains.pageInfo.endCursor)}
            >
              {fetching ? "Loading..." : "Next page"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function AccountView() {
  const params = useParams();
  const raw = params.address ?? "";

  if (!isNormalizedAddress(raw)) {
    // try to coerce mixed-case / checksummed input to a NormalizedAddress and redirect
    try {
      const normalized = toNormalizedAddress(raw);
      return <Navigate to={`/account/${normalized}`} replace />;
    } catch {
      return (
        <div>
          <h2>Invalid address: '{raw}'</h2>
          <Link to="/">Home</Link>
        </div>
      );
    }
  }

  return <RenderAccount key={raw} address={raw} />;
}
