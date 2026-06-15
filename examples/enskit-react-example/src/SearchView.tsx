import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { useEnsnodeInstance } from "./EnsnodeInstanceProvider";

const DomainsByNameQuery = graphql(`
  query DomainsByName($name: DomainsNameFilter!, $first: Int!, $after: String) {
    domains(where: { name: $name }, first: $first, after: $after) {
      edges {
        node { __typename id canonical { name { beautified } } }
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
  const { constants } = useEnsnodeInstance();
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
    variables: {
      name: { starts_with: query },
      first: PAGE_SIZE,
      after,
    },
    pause: query.length === 0,
  });

  const { data, fetching, error } = result;

  return (
    <div>
      <h2>Domain Search</h2>

      <p>
        Showcases live prefix search (typeahead) via <code>Query.domains</code> with a{" "}
        <code>starts_with</code> name filter. Only <b>Canonical</b> Domains (those with an
        inferrable Canonical Name) are searched. Input is debounced by {DEBOUNCE_MS}ms and synced to
        the URL as <code>?query=</code>.
      </p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={constants.defaultSearchLabel}
      />

      {query.length === 0 ? (
        <p>Type to search.</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          {fetching && <p>Loading...</p>}
          <ul>
            {data?.domains?.edges.map((edge) => {
              return (
                <li key={edge.node.id}>
                  ({edge.node.__typename === "ENSv1Domain" ? "v1" : "v2"}){" "}
                  <Link to={`/domain/id/${edge.node.id}`}>
                    {edge.node.canonical?.name.beautified ?? <em>non-canonical domain</em>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {!fetching && data?.domains?.edges.length === 0 && <p>No matches.</p>}
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
