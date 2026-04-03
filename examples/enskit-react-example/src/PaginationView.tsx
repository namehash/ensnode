import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";
import { useState } from "react";
import { Link } from "react-router";

const EthSubdomainsQuery = graphql(`
  query EthSubdomains($first: Int!, $after: String) {
    domain(by: { name: "eth" }) {
      id
      subdomains(first: $first, after: $after) {
        edges {
          node { id name }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

const PAGE_SIZE = 3;

export function PaginationView() {
  const [after, setAfter] = useState<string | null>(null);

  const [result] = useOmnigraphQuery({
    query: EthSubdomainsQuery,
    variables: { first: PAGE_SIZE, after },
  });

  const { data, fetching, error } = result;

  if (!data && fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.domain) return <p>Not found</p>;

  const { subdomains } = data.domain;

  return (
    <div>
      <h2>Subdomains of eth (page size: {PAGE_SIZE})</h2>

      <p>
        This showcases trivial cursor-based pagination (inc. infinite-scroll) for resources in the
        Omnigraph API.
      </p>

      <ul>
        {subdomains?.edges.map((edge) => (
          <li key={edge.node.id}>
            <Link to={`/domain/${edge.node.name}`}>{edge.node.name ?? edge.node.id}</Link>
          </li>
        ))}
      </ul>

      {subdomains?.pageInfo.hasNextPage && (
        <button
          type="button"
          disabled={fetching}
          onClick={() => setAfter(subdomains.pageInfo.endCursor)}
        >
          {fetching ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
