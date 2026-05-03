import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

const DomainsByNameQuery = graphql(`
  query DomainsByName($name: String!, $first: Int!, $after: String) {
    domains(where: { name: $name, canonical: true }, first: $first, after: $after) {
      edges {
        node { __typename id name }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 50;

export function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const [input, setInput] = useState(query);
  const [after, setAfter] = useState<string | null>(null);

  // sync input from URL on external navigation (back/forward, deep link)
  useEffect(() => {
    setInput(query);
  }, [query]);

  // reset cursor whenever the query changes
  useEffect(() => {
    setAfter(null);
  }, [query]);

  // debounce input → URL `?query=`
  useEffect(() => {
    if (input === query) return;
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (input) next.set("query", input);
          else next.delete("query");
          return next;
        },
        { replace: true },
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input, query, setSearchParams]);

  const [result] = useOmnigraphQuery({
    query: DomainsByNameQuery,
    variables: { name: query, first: PAGE_SIZE, after },
    pause: query.length === 0,
  });

  const { data, fetching, error } = result;

  return (
    <div>
      <h2>Domain Search</h2>

      <p>
        Showcases live querying via <code>Query.domains(where: {"{ name }"})</code>. Input is
        debounced by {DEBOUNCE_MS}ms and synced to the URL as <code>?query=</code>.
      </p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="vitalik.eth"
      />

      {query.length === 0 ? (
        <p>Type to search.</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          {fetching && <p>Loading...</p>}
          <ul>
            {data?.domains?.edges.map((edge) => (
              <li key={edge.node.id}>
                ({edge.node.__typename === "ENSv1Domain" ? "v1" : "v2"}){" "}
                <Link to={`/domain/${edge.node.name}`}>{edge.node.name ?? edge.node.id}</Link>
              </li>
            ))}
          </ul>
          {data?.domains && data.domains.edges.length === 0 && !fetching && <p>No matches.</p>}
          {data?.domains?.pageInfo.hasNextPage && (
            <button
              type="button"
              disabled={fetching}
              onClick={() => setAfter(data.domains?.pageInfo.endCursor ?? null)}
            >
              {fetching ? "Loading..." : "Next page"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
